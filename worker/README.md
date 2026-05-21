# Delta Engine — MT5 Worker Testing

This directory contains the Python worker engine and the Phase 1 MVP test scripts.
Because the `MetaTrader5` Python library uses native Windows DLLs, **this code must be executed on a Windows machine** (or a Windows VM / VPS) where the MetaTrader 5 terminal is installed.

## Setup Instructions (Windows)

1. **Install Python 3.9+** on your Windows machine.
2. **Install MetaTrader 5 Terminal** and log in to at least one demo account.
3. Copy this `worker` folder to your Windows machine.
4. Open a command prompt or PowerShell in the `worker` folder and create a virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Running the Tests

Make sure your MT5 terminal is running (or it will be launched automatically by the scripts if the path is in the default location).

Run the scripts in the following order to validate the Phase 1 requirements:

1. **Test Connection & Account Info**
   ```cmd
   python tests\test_connect_mt5.py
   ```
   *Expected:* Connects to MT5, logs in, and prints your balance and open positions.

2. **Test Placing an Order**
   ```cmd
   python tests\test_place_order.py
   ```
   *Expected:* Opens a market buy or sell order on the specified symbol.

3. **Test Closing an Order**
   ```cmd
   python tests\test_close_order.py
   ```
   *Expected:* Lists your open positions and allows you to select one to close.

4. **Test Real-Time Position Detection**
   ```cmd
   python tests\test_detect_positions.py
   ```
   *Expected:* Starts a polling loop. Go to your MT5 terminal and manually open or close a trade. The script should immediately print `🔥 NEW TRADE DETECTED` or `🛑 TRADE CLOSED`.

---
*Note: Make sure "Allow Auto Trading" (Algo Trading) is enabled in your MT5 terminal settings (Tools -> Options -> Expert Advisors).*
