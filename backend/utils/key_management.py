import os
from azure.identity import DefaultAzureCredential
from azure.keyvault.keys import KeyClient
from azure.keyvault.keys.crypto import CryptographyClient, EncryptionAlgorithm, KeyWrapAlgorithm
from dotenv import load_dotenv

load_dotenv()
# Azure Key Vault setup
VAULT_URL = "https://secure-vault-keys.vault.azure.net/"
KEY_NAME = "master-kek"

credential = DefaultAzureCredential()
key_client = KeyClient(vault_url=VAULT_URL, credential=credential)
key = key_client.get_key(KEY_NAME)
crypto_client = CryptographyClient(key, credential=credential)

def wrap_dek_with_kms(dek: bytes) -> bytes:
    """Wrap (encrypt) a DEK with KEK in Azure Key Vault."""
    wrap_result = crypto_client.wrap_key(KeyWrapAlgorithm.rsa_oaep, dek)
    return wrap_result.encrypted_key

def unwrap_dek_with_kms(wrapped_dek: bytes) -> bytes:
    """Unwrap (decrypt) a DEK with KEK in Azure Key Vault."""
    unwrap_result = crypto_client.unwrap_key(KeyWrapAlgorithm.rsa_oaep, wrapped_dek)
    return unwrap_result.key
