"use client";

import { useId, useRef } from "react";
import { useConnect } from "wagmi";

/** Each EIP-6963 connector points to the selected extension's own provider. */
export function WalletConnect() {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const { connect, connectors, isPending, error, reset, variables } = useConnect();

  return (
    <>
      <button type="button" className="dugme dugme-koyu" onClick={() => {
        if (!isPending) reset();
        dialog.current?.showModal();
      }}>Connect wallet</button>
      <dialog ref={dialog} aria-labelledby={title}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[var(--cizgi)] bg-white p-6 text-[var(--yazi)] shadow-xl backdrop:bg-black/35">
        <div className="flex items-center justify-between gap-4">
          <h2 id={title} className="text-xl font-semibold">Choose your wallet</h2>
          <button type="button" className="dugme" aria-label="Close wallet selection"
            onClick={() => dialog.current?.close()}>×</button>
        </div>
        <p className="mt-3 text-sm text-[var(--soluk)]">Select your wallet, then approve the connection in its extension.</p>
        <div className="mt-5 grid gap-2">
          {connectors.map(connector => (
            <button type="button" key={connector.uid} disabled={isPending}
              className="dugme w-full justify-between text-left disabled:opacity-50"
              onClick={() => connect({ connector }, { onSuccess: () => dialog.current?.close() })}>
              {connector.name}{isPending && variables?.connector === connector ? " · Connecting…" : ""}
            </button>
          ))}
        </div>
        {connectors.length === 0 && <p className="mt-4 text-sm">No wallet detected. Enable Rabby or MetaMask in this browser, unlock it, then reload this page. On mobile, open NOMEN in your wallet’s built-in browser.</p>}
        {isPending && <p role="status" className="mt-4 text-sm">Open your wallet extension to approve or cancel the pending request.</p>}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">Connection failed or was cancelled. Unlock your wallet and finish any pending request, then choose your wallet again.<span className="mt-2 block text-xs">{error.message.slice(0, 600)}</span></p>}
        <p className="mt-4 text-xs text-[var(--soluk)]">Connecting does not send a payment or request a transaction signature.</p>
      </dialog>
    </>
  );
}
