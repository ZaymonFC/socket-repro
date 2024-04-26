import "./style.css";
import { Repo } from "@automerge/automerge-repo";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Automerge import Wasm Issue</h1>
    <p class="read-the-docs">
    Minimal example (check console)
    </p>
  </div>
`;

const repo = new Repo({
  network: [new BroadcastChannelNetworkAdapter()],
  storage: new IndexedDBStorageAdapter(),
});

console.log(repo);
