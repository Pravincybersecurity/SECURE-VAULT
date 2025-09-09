import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

def generate_dek():
    return os.urandom(32)

def encrypt_value(plaintext: str, dek: bytes):
    aesgcm = AESGCM(dek)
    iv = os.urandom(12)
    plaintext_bytes = plaintext.encode("utf-8")
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext_bytes, None)
    auth_tag = ciphertext_with_tag[-16:]
    ciphertext = ciphertext_with_tag[:-16]
    
    return ciphertext, iv, auth_tag

def decrypt_value(ciphertext: bytes, iv: bytes, auth_tag: bytes, dek: bytes) -> str:
    aesgcm = AESGCM(dek)
    ciphertext_with_tag = ciphertext + auth_tag
    try:
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext_with_tag, None)
        return decrypted_bytes.decode("utf-8")
    except InvalidTag:
        raise ValueError("Decryption failed: Authentication tag is invalid.")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred during decryption: {e}")

