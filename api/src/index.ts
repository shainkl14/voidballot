/**
 * Shared VoidBallot contract API — browser (1AM / Lace) and CLI.
 */
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  ContractState,
  fromHex,
  type ContractAddress,
} from '@midnight-ntwrk/compact-runtime';

import {
  CompiledVoidBallotContract,
  ledger,
  pureCircuits,
} from '../../contracts/compiled.js';
import {
  createInitialPrivateState,
  type VoidBallotPrivateState,
} from '../../contracts/witnesses.js';
import {
  voidBallotPrivateStateKey,
  type BallotChoice,
  type ChamberState,
  type DeployedVoidBallotContract,
  type VoidBallotProviders,
} from './common-types.js';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class VoidBallotAPI {
  readonly contractAddress: ContractAddress;

  private constructor(
    private readonly deployedContract: DeployedVoidBallotContract,
    private readonly providers: VoidBallotProviders,
  ) {
    this.contractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.contractAddress);
  }

  async castBallot(choice: BallotChoice): Promise<void> {
    if (choice !== 0 && choice !== 1 && choice !== 2) {
      throw new Error('choice must be 0 (aye), 1 (nay), or 2 (void)');
    }
    await (this.deployedContract as any).callTx.castBallot(BigInt(choice));
  }

  async proveVoted(): Promise<void> {
    await (this.deployedContract as any).callTx.proveVoted();
  }

  static nullifierPreview(privateState: VoidBallotPrivateState): string {
    return bytesToHex(pureCircuits.voterNullifier(privateState.voterSecret));
  }

  static decodeChamberState(stateHex: string, networkId?: NetworkId): ChamberState {
    if (networkId !== undefined) {
      setNetworkId(networkId);
    }
    const contractState = ContractState.deserialize(fromHex(stateHex));
    const l = ledger(contractState.data);
    return {
      proposalHash: bytesToHex(l.proposalHash),
      votesAye: Number(l.votesAye as unknown as bigint),
      votesNay: Number(l.votesNay as unknown as bigint),
      votesVoid: Number(l.votesVoid as unknown as bigint),
      totalBallots: Number(l.totalBallots as unknown as bigint),
    };
  }

  static async fetchChamberState(
    queryUrl: string,
    contractAddress: string,
    networkId?: NetworkId,
  ): Promise<ChamberState> {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `query LATEST_CONTRACT_STATE($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }`,
        variables: { address: contractAddress },
      }),
    });
    if (!res.ok) throw new Error(`Indexer HTTP error: ${res.status}`);
    const payload = await res.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((e: { message: string }) => e.message).join('; '));
    }
    const hex = payload.data?.contractAction?.state ?? null;
    if (!hex) {
      return {
        proposalHash: '',
        votesAye: 0,
        votesNay: 0,
        votesVoid: 0,
        totalBallots: 0,
      };
    }
    return VoidBallotAPI.decodeChamberState(hex, networkId);
  }

  static async deploy(
    providers: VoidBallotProviders,
    privateState: VoidBallotPrivateState,
    proposal: Uint8Array,
  ): Promise<VoidBallotAPI> {
    const deployedContract = await (deployContract as any)(providers, {
      compiledContract: CompiledVoidBallotContract,
      privateStateId: voidBallotPrivateStateKey,
      initialPrivateState: privateState,
      args: [proposal],
    });
    return new VoidBallotAPI(deployedContract, providers);
  }

  static async join(
    providers: VoidBallotProviders,
    contractAddress: ContractAddress,
    privateState: VoidBallotPrivateState,
    compiledContract: typeof CompiledVoidBallotContract = CompiledVoidBallotContract,
  ): Promise<VoidBallotAPI> {
    const deployedContract = await findDeployedContract(providers as any, {
      contractAddress,
      compiledContract,
      privateStateId: voidBallotPrivateStateKey,
      initialPrivateState: privateState,
    });
    return new VoidBallotAPI(deployedContract, providers);
  }
}

export * from './common-types.js';
