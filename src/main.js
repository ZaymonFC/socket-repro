import "./style.css";

document.querySelector("#app").innerHTML = `
  <div>
    <h1>Duplex issue</h1>
    <p class="read-the-docs">
    Minimal example (check console)
    </p>
  </div>
`;

import { Framer } from "./Framer";

const main = async () => {
  const framer1 = new Framer();
  const framer2 = new Framer();

  // Connect the streams
  framer1.stream.pipe(framer2.stream).pipe(framer1.stream);

  // Set up subscriptions
  const unsubscribe1 = framer1.port.subscribe((message) => {
    const data = new TextDecoder().decode(message);
    console.log("Framer1 received:", data);
  });

  const unsubscribe2 = framer2.port.subscribe((message) => {
    const data = new TextDecoder().decode(message);
    console.log("Framer2 received:", data);
  });

  // Send messages
  await framer1.port.send(new TextEncoder().encode("Hello from Framer1"));
  await framer2.port.send(new TextEncoder().encode("Hello from Framer2"));

  // Wait for a moment to allow messages to be processed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Clean up
  unsubscribe1();
  unsubscribe2();
  framer1.destroy();
  framer2.destroy();

  console.log(
    "Framer1 - Bytes sent:",
    framer1.bytesSent,
    "Bytes received:",
    framer1.bytesReceived,
  );
  console.log(
    "Framer2 - Bytes sent:",
    framer2.bytesSent,
    "Bytes received:",
    framer2.bytesReceived,
  );
};

void main();
