# Wallet connection repair

The header and profile previously selected connectors[0], the generic injected provider. With several extensions installed this could select MetaMask instead of Rabby. Replaced generic injection with explicit EIP-6963 discovery and a shared accessible native-dialog selector. Each choice uses its own provider; errors and pending wallet approval are visible, and disconnected browsers get setup instructions. Added Claim a name to application navigation.

Validation: TypeScript and targeted ESLint passed. Browser detected Rabby Wallet, Coinbase Wallet, MetaMask and Phantom as separate choices. Claim page renders nomen-demo.eth form. Production build passed. A live retry exposed `Connector already connected` while the header remained disconnected: automatic multi-wallet reconnection could stall after selecting a current connector. Disabled reconnect-on-mount and persisted wallet state (non-persisting createStorage adapter); application network preferences and draft storage remain intact. Reloading the page now requires explicitly choosing a wallet again.

Local browser successfully connected the existing Rabby account: the header showed the address and the claim form marked the connection step complete. No payment or claim was submitted.

The installed wagmi SSR hydration path requires the persistence wrapper for provider discovery, so the non-persisting adapter retains the wrapper while returning no old session.

Final production deployment: dpl_2ybHTaw6pmXbadctdbq8kUKcEGzg, https://nomen-beta.vercel.app. Live Rabby connection succeeded: header address and claim connection checkmark verified. Reload/reconnect and client-side navigation were also checked locally.
