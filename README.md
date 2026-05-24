# cluj-hackathon-2026-ba67

Built for Cluj Hackathon 2026.

# Votera

Votera is a digital voting platform built for secure, transparent, and validator-based elections.

The project contains two main user-facing parts:

- a **mobile application** for citizens/users to view elections and cast votes;
- a **web dashboard** for validators to monitor elections, validator status, submitted votes, and backend activity.

The platform is deployed on a **DigitalOcean cloud server** and runs multiple backend services using Docker.

## Team

Team name: `BananAmigo67`

Team members:

- `Krizbai Mátyás`
- `Nagy Sámuel`
- `Veres Norbert`

## Main Idea

The main idea behind Votera is to create a simple but secure digital voting system where users can vote from a mobile application, while independent validator nodes verify the vote before it is accepted.

Instead of relying on a single central authority, the system uses multiple validator services. Each validator checks whether the voter is eligible and whether the vote request is valid. The result is then processed through the backend consensus flow.

For the hackathon version, eligibility is checked using local JSON-based voter lists available to the validator nodes. The system also avoids sending the raw digital ID directly by encrypting it before submitting the vote.

## Concept

Votera separates the system into three major parts:

1. **Mobile App**
   - Used by voters.
   - Allows users to view available elections.
   - Fetches the public key for an election.
   - Encrypts the user’s digital ID before sending the vote.
   - Sends the encrypted identity together with the selected vote.

2. **Validator Dashboard**
   - Used by validators and organizers.
   - Provides visibility over validator nodes.
   - Shows backend status and election-related information.
   - Helps monitor the voting process.

3. **Backend and Validator Network**
   - Handles elections, vote submission, validation, and consensus.
   - Uses multiple gateway and validator services.
   - Validators decrypt the encrypted voter ID, check eligibility, and continue the vote verification process.

## Technical Overview

The project uses a multi-service architecture deployed with Docker on a DigitalOcean droplet.

Main technical components:

- **Mobile app** for users to cast votes.
- **Web dashboard** for validators.
- **Gateway services** for exposing backend functionality.
- **Validator services** for checking and validating votes.
- **n8n service** for workflow automation.
- **Feed API** for ingesting and serving supporting data.
- **Docker Compose** for service orchestration.
- **GitHub Actions** for deployment to the DigitalOcean server.

## Digital ID Encryption Flow

The current architecture uses election-level asymmetric encryption.

When an election is created, the backend generates an election key pair:

- `electionPublicKey`
- `electionPrivateKey`

The public key is exposed to the mobile app. The private key is available to validator nodes.

Voting flow:

1. The user selects an election in the mobile app.
2. The mobile app fetches the election public key.
3. The mobile app encrypts the user’s digital ID using the election public key.
4. The mobile app submits the vote with the encrypted digital ID.
5. A validator receives the vote request.
6. The validator decrypts the digital ID using the election private key.
7. The validator checks the decrypted digital ID against a local eligibility JSON list.
8. If the voter is eligible, the vote continues through the existing validation and consensus process.
9. If the voter is not eligible, the vote is rejected.

For the hackathon version, validator nodes are allowed to decrypt and see the digital ID. The goal is to avoid sending raw digital IDs through the public API or directly from the mobile client.

## Services and Ports

| Service | Port on Droplet |
|---|---:|
| Dashboard | 5173 |
| Gateway 1 | 4001 |
| Gateway 2 | 4002 |
| n8n | 5678 |
| Feed API | 3001 |

Example access URLs:

```txt
N8N:
http://165.232.67.137:5678

GATEWAYS:
http://165.232.67.137:4001
http://165.232.67.137:4002

DASHBOARD:
http://165.232.67.137:5173