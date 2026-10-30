// This adapter has no signing or transaction interface. Provider objects remain private.
const NETWORKS = Object.freeze({
  '0x1': { name: 'Ethereum', symbol: 'ETH', testnet: false },
  '0xa': { name: 'Optimism', symbol: 'ETH', testnet: false },
  '0x38': { name: 'BNB Smart Chain', symbol: 'BNB', testnet: false },
  '0x89': { name: 'Polygon', symbol: 'POL', testnet: false },
  '0x2105': { name: 'Base', symbol: 'ETH', testnet: false },
  '0xa4b1': { name: 'Arbitrum One', symbol: 'ETH', testnet: false },
  '0xa86a': { name: 'Avalanche C-Chain', symbol: 'AVAX', testnet: false },
  '0xaa36a7': { name: 'Sepolia', symbol: 'ETH de prueba', testnet: true },
});
const READ_METHODS = new Set(['eth_accounts', 'eth_chainId', 'eth_blockNumber', 'eth_getBalance']);
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const QUANTITY = /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/;
function quantity(value) {
  if (typeof value !== 'string' || !QUANTITY.test(value) || value.length > 66)
    throw new Error('INVALID_RESPONSE');
  return value.toLowerCase();
}
function address(accounts) {
  if (!Array.isArray(accounts) || !accounts.length || !ADDRESS.test(accounts[0]))
    throw new Error('NO_ACCOUNT');
  return accounts[0];
}
export function formatNativeBalance(value) {
  const n = BigInt(quantity(value));
  const scale = 10n ** 18n;
  const fraction = (n % scale).toString().padStart(18, '0').replace(/0+$/, '');
  return `${(n / scale).toString()}${fraction ? '.' + fraction : ''}`;
}
function errorText(error) {
  if (error?.code === 4001) return 'Conexión cancelada en tu wallet. Puedes intentarlo otra vez.';
  if (error?.code === -32002) return 'Ya hay una solicitud abierta. Revísala en tu wallet.';
  if ([4100, 4900, 4901].includes(error?.code))
    return 'La wallet perdió acceso. Vuelve a conectarla.';
  if (error?.message === 'TIMEOUT')
    return 'La wallet no respondió a tiempo. Revisa su ventana y vuelve a intentarlo.';
  if (error?.message === 'NO_ACCOUNT')
    return 'No hay una cuenta autorizada. Selecciónala en tu wallet.';
  return 'No pudimos comprobar la lectura. Actualiza o vuelve a conectar tu wallet.';
}
export function createWalletSession({ onChange = () => {}, timeoutMs = 20000 } = {}) {
  let state = {
    status: 'disconnected',
    account: null,
    chainId: null,
    network: null,
    balance: null,
    block: null,
    readAt: null,
    providerName: null,
    error: null,
  };
  let provider = null;
  let revision = 0;
  let handlers = null;
  let busy = false;
  const snapshot = () => ({ ...state, network: state.network ? { ...state.network } : null });
  const publish = patch => {
    state = { ...state, ...patch };
    onChange(snapshot());
  };
  async function request(target, method, params, consent = false) {
    if (!READ_METHODS.has(method) && !(consent && method === 'eth_requestAccounts'))
      throw new Error('METHOD_NOT_ALLOWED');
    let timer;
    try {
      return await Promise.race([
        Promise.resolve().then(() => target.request(params ? { method, params } : { method })),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  function detach() {
    if (provider && handlers)
      for (const [event, handler] of Object.entries(handlers)) {
        try {
          provider.removeListener(event, handler);
        } catch {
          /* Clear local state even if extension failed. */
        }
      }
    handlers = null;
  }
  function disconnect(message = null) {
    revision++;
    detach();
    provider = null;
    busy = false;
    publish({
      status: 'disconnected',
      account: null,
      chainId: null,
      network: null,
      balance: null,
      block: null,
      readAt: null,
      providerName: null,
      error: message,
    });
  }
  async function read() {
    if (!provider || busy) return;
    busy = true;
    const target = provider,
      current = ++revision;
    const active = () => revision === current && target === provider;
    publish({ status: 'reading', balance: null, block: null, readAt: null, error: null });
    try {
      const accounts = await request(target, 'eth_accounts');
      if (!active()) return;
      const account = address(accounts);
      const chainId = quantity(await request(target, 'eth_chainId'));
      if (!active()) return;
      const network = Object.hasOwn(NETWORKS, chainId) ? NETWORKS[chainId] : null;
      publish({ account, chainId, network });
      if (!network) {
        publish({ status: 'unsupported' });
        return;
      }
      const block = quantity(await request(target, 'eth_blockNumber'));
      if (!active()) return;
      const balance = formatNativeBalance(
        await request(target, 'eth_getBalance', [account, block])
      );
      if (!active()) return;
      // Never attach a response from the previous account or network to the new one.
      const [finalChain, finalAccounts] = await Promise.all([
        request(target, 'eth_chainId'),
        request(target, 'eth_accounts'),
      ]);
      if (!active()) return;
      if (
        quantity(finalChain) !== chainId ||
        address(finalAccounts).toLowerCase() !== account.toLowerCase()
      )
        throw new Error('CONTEXT_CHANGED');
      publish({
        status: 'connected',
        balance,
        block: BigInt(block).toString(),
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      if (!active()) return;
      if (error?.message === 'NO_ACCOUNT' || [4100, 4900, 4901].includes(error?.code))
        disconnect(errorText(error));
      else
        publish({
          status: 'error',
          balance: null,
          block: null,
          readAt: null,
          error: errorText(error),
        });
    } finally {
      if (active()) busy = false;
    }
  }
  async function connect(target, name = 'Wallet del navegador') {
    disconnect();
    if (
      !target ||
      typeof target.request !== 'function' ||
      typeof target.on !== 'function' ||
      typeof target.removeListener !== 'function'
    ) {
      publish({ error: 'Esta wallet no ofrece una conexión compatible.' });
      return;
    }
    provider = target;
    const current = ++revision;
    busy = true;
    publish({ status: 'connecting', providerName: String(name).slice(0, 60) });
    try {
      // This is the only permission request and is called only after the user selects a wallet.
      const accounts = await request(target, 'eth_requestAccounts', undefined, true);
      if (current !== revision || provider !== target) return;
      address(accounts);
      const changed = () => {
        revision++;
        busy = false;
        publish({
          account: null,
          chainId: null,
          network: null,
          balance: null,
          block: null,
          readAt: null,
        });
        void read();
      };
      handlers = {
        accountsChanged: changed,
        chainChanged: changed,
        disconnect: () => disconnect('La wallet se desconectó.'),
      };
      for (const [event, handler] of Object.entries(handlers)) provider.on(event, handler);
      busy = false;
      await read();
    } catch (error) {
      if (current === revision && provider === target) disconnect(errorText(error));
    }
  }
  return Object.freeze({ connect, refresh: read, disconnect, getState: snapshot });
}

// Discovery is opt-in. Visiting the page does not enumerate installed wallets.
export function discoverWallets(host, onChange) {
  const entries = [];
  let ended = false;
  function add(info, provider) {
    if (
      ended ||
      entries.length >= 20 ||
      !provider ||
      typeof provider.request !== 'function' ||
      typeof provider.on !== 'function' ||
      typeof provider.removeListener !== 'function' ||
      entries.some(entry => entry.provider === provider)
    )
      return;
    const entry = {
      id: entries.length,
      name: String(info?.name || 'Wallet del navegador').slice(0, 60),
      provider,
    };
    entries.push(entry);
    onChange(entries.slice());
  }
  const announce = event => {
    const detail = event?.detail;
    if (detail?.info && typeof detail.info.name === 'string') add(detail.info, detail.provider);
  };
  host.addEventListener('eip6963:announceProvider', announce);
  host.dispatchEvent(new host.Event('eip6963:requestProvider'));
  // Legacy fallback is attempted only following the same explicit click.
  try {
    if (!entries.length && host.ethereum) add({ name: 'Wallet del navegador' }, host.ethereum);
  } catch {
    /* No accessible provider. */
  }
  return () => {
    ended = true;
    host.removeEventListener('eip6963:announceProvider', announce);
  };
}
