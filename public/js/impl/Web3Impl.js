import { createAppKit } from '@reown/appkit';
import { baseUSDC, baseETH, pay } from '@reown/appkit-pay';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, arbitrum } from '@reown/appkit/networks';
import { createSIWEConfig, formatMessage } from '@reown/appkit-siwe';
import { SiweMessage } from 'siwe';
import { ethers, BrowserProvider } from 'ethers' ;
import { Buffer } from 'buffer'
import { log, fetchWithTimeout } from '../utils.js';

window.Buffer = Buffer

export default class Web3Impl {
	constructor (app) {
		this.app = app;
		this.ESCROW_CONTRACT_ADDRESS = this.app.data.smartContractAddress;
		this.escrowABI = [ 'function createEscrow(string transactionId, address buyer, address seller) external payable' ];
	}

	init() {
		this.siweConfig = createSIWEConfig({
			getMessageParams : async () => ({ domain: window.location.host, uri: window.location.origin, chains: [1, 2020], statement: 'Sign this message to authenticate.' }),
			createMessage: ({ address, ...args }) => formatMessage(args, address),
			verifyMessage: async ({ message, signature }) => {
				try {
					const response = await fetchWithTimeout('/api/web3/verify', {
						method: 'POST',
						headers: await this.app.authHeaders(),
						body: JSON.stringify({ walletAddress: this.appkit.getAddress(), message, signature }),
					});

					if (this.app.data.userdata) {
						response.data.expiresIn = (new Date() / 1000) + Number(response.data.expiresIn);
						this.app.data = this.data || {};
						this.app.data.userdata = response.user;
						this.app.storage.put('authToken', response.data, response.user.uid);
					}

					return true;
				} catch (_) {
					return false;
				}
			},
			getNonce: async () => {
				try {
					const { nonce } = await fetchWithTimeout('/api/web3/nonce', {
						method: 'GET',
					});
					return nonce;
				} catch (_) {
					throw new Error('Failed to get nonce');
				}
			},
			getSession: async () => this.app.data.userdata ? { wallletAddress: this.app.data.userdata.walletAddress } : null
		});

		this.appkit = createAppKit({
			adapters: [new EthersAdapter()],
			networks: [mainnet, arbitrum],
			metadata: this.app.metadata,
			projectId: this.app.data.REOWN_KEY,
			siweConfig: this.siweConfig, features: { analytics: true, onramp: true }
		});

		this.appkit.subscribeAccount(state => this.address = state['accountState']?.address);
	}

	async getBalance() {
		try {
			const walletProvider = this.appkit.getWalletProvider();
			const address = this.appkit.getAddress();
			const provider = new ethers.JsonRpcProvider('https://clodflare-eth.com');
			const balanceWei = await provider.getBalance(address);
			const balanceEth = await ether.formatEther(balanceWei);
			return { balanceWei, balanceEth };
		} catch (e) {
			log.error('Failed to fetch wallet balance:', e);
		}
	}

	async getTxHistory() {
		const address = this.appkit.getAddress();
		if (!address) return;
	}

	async fundWallet() {
		const result = await pay({
			recipient: this.appkit.getAddress(),
			amount: 0.0001,
			paymentAsset: baseUSDC
		});

		if (reault.success) log('Payment successful:', result.result);
		else log.error('Payment error:', result.error);
		return result;
	}

	async withdraw(toAddress, amount) {
		try {
			const walletProvider = this.appkit.getWalletProvider();
			const browserProvider = new ethers.BrowserProvider(walletProvider);
			const signer = await browserProvider.getSigner();

			const tx = await signer.sendTransaction({ to: toAddress, value: ethers.parseEther(String(amount)) });
			log('Transaction Broadcasted:', tx.hash);
			await tx.wait();
			log('Withdrawal Complete');
		} catch (e) {
			log.error('Failed to exec withdrawal:', e);
		}
	}

	async createEscrow(sellerAddress, amount) {
		try {
			const walletProvider = this.appkit.getWalletProvider();
			const browserProvider = new ethers.BrowserProvider(walletProvider);
			const signer = await browserProvider.getSigner();
			const buyerAddress = await signer.getAddress();

			const contract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, escrowABI, signer);
			const tx = await contract.createEscrow(sellerAddress, { value: ethers.parseEther(String(amount)) });
			log('Transaction pending on-chain...', tx.hash);

			const receipt = await tx.wait();
			log('Transaction confirmed in block:', receipt.blockNumber);
			
			const syncPayload = {
				transactionHash: tx.hash,
				blockNumber: receipt.blockNumber,
				buyerAddress, sellerAddress, amount,
				status: 'DEPOSITED',
				timestamp: new Date().toISOString()
			};

			const result = await fetchWithTimeout('/api/wallet/escrow/sync', {
				method: 'POST',
				headers: await this.app.authHeaders(),
				body: JSON.stringify(syncPayload)
			});
		} catch (e) {
			log.error('Escrow transaction failed:', e);
		}
	}
}
