"""
Delta Engine — AES-256-GCM Credential Encryption
Encrypts broker passwords before storage. Decrypts only in worker context.
Raw passwords never touch logs, frontend, or admin views.
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import get_settings


# Nonce size for AES-GCM (96 bits = 12 bytes, NIST recommended)
NONCE_SIZE = 12


def _get_key() -> bytes:
    """Load the 256-bit encryption key from environment."""
    settings = get_settings()
    key_hex = settings.encryption_key
    key_bytes = bytes.fromhex(key_hex)
    if len(key_bytes) != 32:
        raise ValueError(
            f"Encryption key must be 256 bits (32 bytes), got {len(key_bytes)} bytes"
        )
    return key_bytes


def encrypt_password(plaintext: str) -> str:
    """
    Encrypt a broker password using AES-256-GCM.
    
    Returns a base64-encoded string containing: nonce || ciphertext || tag
    The nonce is randomly generated for each encryption.
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_SIZE)
    
    # AES-GCM encrypt — ciphertext includes the 16-byte auth tag
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    
    # Combine: nonce + ciphertext (with tag appended)
    encrypted_blob = nonce + ciphertext
    
    return base64.b64encode(encrypted_blob).decode("utf-8")


def decrypt_password(encrypted_b64: str) -> str:
    """
    Decrypt a broker password from its base64-encoded AES-256-GCM blob.
    
    This function should ONLY be called in worker contexts.
    Never call this in API response serialization or logging.
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    
    encrypted_blob = base64.b64decode(encrypted_b64)
    
    # Split: first 12 bytes = nonce, rest = ciphertext + tag
    nonce = encrypted_blob[:NONCE_SIZE]
    ciphertext = encrypted_blob[NONCE_SIZE:]
    
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    
    return plaintext.decode("utf-8")
