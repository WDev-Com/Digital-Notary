import React, { useState, useEffect } from "react";
import Web3 from "web3";
import SimpleDigitalNotary from "./SimpleDigitalNotary.json"; // ABI from contract compilation
import SHA256 from "crypto-js/sha256"; // Using crypto-js for hashing
/**
 *
 * CHANGE THE  CONTRACT_ADDRESS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 */
const CONTRACT_ADDRESS = "0x2713C023d563AC56834FFC0839f60986C0076907"; // Update this with your deployed contract address
/**
 * Change the after every redeployment of contract
 https://stackoverflow.com/questions/71849218/throw-new-error-returned-values-arent-valid-did-it-run-out-of-gas
 */
function App() {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [message, setMessage] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [owner, setOwner] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [isNotarized, setIsNotarized] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      const web3Instance = new Web3("http://127.0.0.1:7545"); // Ganache's default RPC URL
      const accounts = await web3Instance.eth.getAccounts(); // Get accounts from Ganache
      setAccount(accounts[0]);
      setWeb3(web3Instance);

      const contractInstance = new web3Instance.eth.Contract(
        SimpleDigitalNotary.abi,
        CONTRACT_ADDRESS
      );
      setContract(contractInstance);
    };
    initWeb3();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileBuffer = event.target.result; // This is an ArrayBuffer
        const uint8Array = new Uint8Array(fileBuffer);
        const binaryString = Array.from(uint8Array)
          .map((byte) => String.fromCharCode(byte))
          .join("");
        const hash = SHA256(binaryString).toString();
        setFileHash(hash);
        alert("File loaded and hashed successfully!");
      };
      reader.onerror = (error) => {
        console.error("File reading error:", error);
        alert("Error reading file: " + error.message);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("No file selected.");
    }
  };

  const notarizeDocument = async () => {
    if (contract && fileHash) {
      try {
        // Log the file hash being used
        console.log("File Hash being used for notarization:", fileHash);

        // Check if the document is already notarized
        const result = await contract.methods.verifyDocument(fileHash).call();
        console.log("Verification Result: ", result); // Debugging line

        if (result[0]) {
          // If already notarized, show a message
          alert(
            "Document has already been notarized by " +
              result[1] +
              " at " +
              new Date(Number(result[2]) * 1000).toLocaleString()
          );
          return; // Exit the function
        }

        // If not notarized, proceed to notarize
        await contract.methods
          .notarizeDocument(fileHash)
          .send({ from: account, gas: 3000000 });

        // After successful notarization
        setMessage("Document notarized successfully!");
        alert("Document notarized successfully!");
      } catch (error) {
        console.error("Error notarizing document:", error); // Log detailed error
        setMessage("Error notarizing document: " + error.message);
        alert("Error notarizing document: " + error.message);
      }
    } else {
      alert("Contract or file hash is not available.");
    }
  };

  const verifyDocument = async () => {
    if (contract && fileHash) {
      try {
        const result = await contract.methods.verifyDocument(fileHash).call();
        if (result[0]) {
          const timestamp = Number(result[2]); // Explicit conversion
          setMessage(
            `Document is notarized by ${result[1]} at ${new Date(
              timestamp * 1000
            ).toLocaleString()}`
          );
          alert(
            `Document is notarized by ${result[1]} at ${new Date(
              timestamp * 1000
            ).toLocaleString()}`
          ); // Alert for successful verification
        } else {
          setMessage("Document is not notarized.");
          alert("Document is not notarized."); // Alert for not notarized
        }
      } catch (error) {
        setMessage("Error verifying document: " + error.message);
        alert("Error verifying document: " + error.message); // Alert for error
      }
    }
  };

  const getDocumentDetails = async () => {
    if (!contract || !documentHash) {
      alert("Please enter a document hash.");
      return;
    }

    try {
      const result = await contract.methods
        .getDocumentDetails(documentHash)
        .call();
      setOwner(result.owner);

      // Explicitly convert timestamp to a regular number
      const timestamp = Number(result.timestamp);
      setTimestamp(new Date(timestamp * 1000).toLocaleString()); // Convert UNIX timestamp to readable date
      setIsNotarized(true);
      alert(
        `Document details fetched successfully: Owner - ${
          result.owner
        }, Timestamp - ${new Date(timestamp * 1000).toLocaleString()}`
      ); // Alert for successful fetch
    } catch (error) {
      console.error("Error fetching document details:", error);
      setIsNotarized(false);
      alert("Document has not been notarized or an error occurred."); // Alert for error
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Simple Digital Notary</h1>
        <p className="mb-4">
          Connected Account: <span className="font-mono">{account}</span>
        </p>
        <input
          type="file"
          onChange={handleFileChange}
          className="border rounded p-2 mb-4 w-full"
        />
        <p className="mb-4">
          File Hash: <span className="font-mono break-all">{fileHash}</span>
        </p>
        <button
          onClick={notarizeDocument}
          className="bg-blue-500 text-white rounded py-2 px-4 mb-2 hover:bg-blue-600 transition duration-200"
        >
          Notarize Document
        </button>
        <button
          onClick={verifyDocument}
          className="bg-green-500 text-white rounded py-2 px-4 mb-4 hover:bg-green-600 transition duration-200"
        >
          Verify Document
        </button>
        <p>{message}</p>
      </div>

      <br />

      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md mt-6">
        <h3 className="text-xl font-semibold mb-2">Check Document Details</h3>
        <input
          type="text"
          placeholder="Enter Document Hash"
          value={documentHash}
          onChange={(e) => setDocumentHash(e.target.value)}
          className="border rounded p-2 mb-4 w-full"
        />
        <button
          onClick={getDocumentDetails}
          className="bg-yellow-500 text-white rounded py-2 px-4 hover:bg-yellow-600 transition duration-200"
        >
          Get Document Details
        </button>
      </div>

      {isNotarized ? (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md mt-6">
          <h3 className="text-xl font-semibold mb-2">Document Details:</h3>
          <p>
            <strong>Owner Address:</strong> {owner}
          </p>
          <p>
            <strong>Timestamp:</strong> {timestamp}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-gray-600">
          Document not notarized or no details available.
        </p>
      )}
    </div>
  );
}

export default App;
