import "./style.css";
import { Client } from "@dxos/client";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>DXOS Client Wasm Issue</h1>
    <p class="read-the-docs">
    Minimal example (check console)
    </p>
  </div>
`;

const client = new Client();
console.log("DXOS Client Initialise", client);
