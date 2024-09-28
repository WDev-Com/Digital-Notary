// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract SimpleDigitalNotary {
    
    // Struct to store document details
    struct Document {
        address owner;         // Owner of the document
        uint256 timestamp;     // Timestamp of when the document was notarized
    }

    // Mapping to store the document hash and its details
    mapping(string => Document) private documents;

    // Event to notify that a document has been notarized
    event DocumentNotarized(address indexed owner, string documentHash, uint256 timestamp);

    // Function to notarize a document by storing its hash
    function notarizeDocument(string memory _documentHash) public {
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty.");
        require(documents[_documentHash].timestamp == 0, "Document has already been notarized.");

        // Store document details in the mapping
        documents[_documentHash] = Document({
            owner: msg.sender,
            timestamp: block.timestamp
        });

        // Emit the event that the document was notarized
        emit DocumentNotarized(msg.sender, _documentHash, block.timestamp);
    }

    // Function to verify if a document has been notarized
    function verifyDocument(string memory _documentHash) public view returns (bool, address, uint256) {
        Document memory doc = documents[_documentHash];
        if (doc.timestamp != 0) {
            // Document has been notarized
            return (true, doc.owner, doc.timestamp);
        } else {
            // Document has not been notarized
            return (false, address(0), 0);
        }
    }
    
    // Function to get the details of a notarized document
    function getDocumentDetails(string memory _documentHash) public view returns (address owner, uint256 timestamp) {
        Document memory doc = documents[_documentHash];
        require(doc.timestamp != 0, "Document has not been notarized.");
        return (doc.owner, doc.timestamp);
    }
}