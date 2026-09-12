"""NOMEN tarayıcısı: desteklenen ERC-8004 ağ tanımları."""
ZINCIRLER = {
    "ethereum": {
        "ad": "Ethereum",
        "chain_id": 1,
        # Anahtarsız ve toplu (batch) JSON-RPC kabul eden uçlar. Ankr anahtar istiyor, listede yok.
        "rpc": ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"],
        "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
        "validation": None,
        "tarayici_url": "https://etherscan.io/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=",
    },
    "sepolia": {
        "ad": "Sepolia",
        "chain_id": 11155111,
        "rpc": ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org"],
        # ERC-8004 Sepolia dağıtımı; ENSv2 de burada olduğu için isim talebi bu zincirde yapılıyor
        "identity": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
        "reputation": "0x8004B663056A597Dffe9eCcC1965A193B7388713",
        "validation": "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
        "tarayici_url": "https://sepolia.etherscan.io/token/0x8004A818BFB912233c491871b3d84c89A494BD9e?a=",
    },
    "arbitrum": {
        "ad": "Arbitrum Sepolia",
        "chain_id": 421614,
        "rpc": ["https://arbitrum-sepolia-rpc.publicnode.com", "https://sepolia-rollup.arbitrum.io/rpc"],
        "identity": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
        "reputation": "0x8004B663056A597Dffe9eCcC1965A193B7388713",
        "validation": "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
        "tarayici_url": "https://sepolia.arbiscan.io/token/0x8004A818BFB912233c491871b3d84c89A494BD9e?a=",
    },
    "arc": {
        "ad": "Arc testnet",
        "chain_id": 5042002,
        "rpc": ["https://rpc.testnet.arc.network"],
        "identity": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
        "reputation": "0x8004B663056A597Dffe9eCcC1965A193B7388713",
        "validation": "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
        "tarayici_url": "https://explorer.testnet.arc.network/token/0x8004A818BFB912233c491871b3d84c89A494BD9e?a=",
    },
}
