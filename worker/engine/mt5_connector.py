"""
Delta Engine — MT5 Connector
Encapsulates MetaTrader 5 Python integration.
Provides a clean interface for initializing, logging in, fetching state, and executing orders.
"""

import time
import structlog
from typing import Optional, List, Dict, Any

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None
    print("Warning: MetaTrader5 package not found or running on non-Windows OS.")

logger = structlog.get_logger()


class MT5Connector:
    def __init__(self, login: int, password: str, server: str, terminal_path: Optional[str] = None):
        self.login = login
        self.password = password
        self.server = server
        self.terminal_path = terminal_path
        self.connected = False

    def initialize(self) -> bool:
        """Initialize connection to the MT5 terminal."""
        if mt5 is None:
            logger.error("mt5_import_failed", reason="Module not available")
            return False

        init_kwargs = {}
        if self.terminal_path:
            init_kwargs['path'] = self.terminal_path

        if not mt5.initialize(**init_kwargs):
            error = mt5.last_error()
            logger.error("mt5_initialize_failed", error=error)
            return False
        
        return True

    def login_account(self) -> bool:
        """Log in to the specific trading account."""
        if not mt5.login(login=self.login, password=self.password, server=self.server):
            error = mt5.last_error()
            logger.error("mt5_login_failed", login=self.login, server=self.server, error=error)
            return False

        self.connected = True
        logger.info("mt5_login_success", login=self.login, server=self.server)
        return True

    def shutdown(self):
        """Cleanly shut down the MT5 connection."""
        if mt5 is not None:
            mt5.shutdown()
        self.connected = False
        logger.info("mt5_shutdown", login=self.login)

    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """Fetch basic account information."""
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("mt5_get_account_info_failed", error=mt5.last_error())
            return None
        return account_info._asdict()

    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch and select symbol information."""
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            logger.error("mt5_symbol_not_found", symbol=symbol)
            return None
            
        # Ensure the symbol is selected in the Market Watch
        if not symbol_info.visible:
            if not mt5.symbol_select(symbol, True):
                logger.error("mt5_symbol_select_failed", symbol=symbol)
                return None
                
        return symbol_info._asdict()

    def get_open_positions(self) -> List[Dict[str, Any]]:
        """Fetch all open positions."""
        positions = mt5.positions_get()
        if positions is None:
            logger.error("mt5_get_positions_failed", error=mt5.last_error())
            return []
        return [p._asdict() for p in positions]

    def place_market_order(
        self, symbol: str, order_type: int, volume: float, sl: float = 0.0, tp: float = 0.0, deviation: int = 10, magic: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        Place a market order (ORDER_TYPE_BUY or ORDER_TYPE_SELL).
        order_type should be mt5.ORDER_TYPE_BUY or mt5.ORDER_TYPE_SELL.
        """
        symbol_info = self.get_symbol_info(symbol)
        if not symbol_info:
            return None

        # Determine price based on order type
        if order_type == mt5.ORDER_TYPE_BUY:
            price = mt5.symbol_info_tick(symbol).ask
        elif order_type == mt5.ORDER_TYPE_SELL:
            price = mt5.symbol_info_tick(symbol).bid
        else:
            logger.error("invalid_order_type", order_type=order_type)
            return None

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": float(volume),
            "type": order_type,
            "price": price,
            "sl": float(sl),
            "tp": float(tp),
            "deviation": deviation,
            "magic": magic,
            "comment": "Delta Engine Copy",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC, # Using IOC as it's universally supported by most brokers
        }

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error("mt5_order_send_failed", result=result._asdict())
            return result._asdict()

        logger.info("mt5_order_send_success", ticket=result.order, symbol=symbol, volume=volume, type=order_type)
        return result._asdict()

    def close_position(self, ticket: int, deviation: int = 10) -> Optional[Dict[str, Any]]:
        """Close an open position fully."""
        position = mt5.positions_get(ticket=ticket)
        if position is None or len(position) == 0:
            logger.error("mt5_close_position_not_found", ticket=ticket)
            return None
        
        position = position[0]
        symbol = position.symbol
        volume = position.volume
        order_type = position.type

        # Opposite type for closing
        if order_type == mt5.ORDER_TYPE_BUY:
            close_type = mt5.ORDER_TYPE_SELL
            price = mt5.symbol_info_tick(symbol).bid
        else:
            close_type = mt5.ORDER_TYPE_BUY
            price = mt5.symbol_info_tick(symbol).ask

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": close_type,
            "position": ticket,
            "price": price,
            "deviation": deviation,
            "magic": position.magic,
            "comment": "Delta Engine Close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error("mt5_close_position_failed", result=result._asdict())
            return result._asdict()

        logger.info("mt5_close_position_success", ticket=ticket, symbol=symbol)
        return result._asdict()
