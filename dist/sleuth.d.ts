import { Provider } from '@ethersproject/providers';
import { AbiCoder, FunctionFragment, Fragment, Interface } from '@ethersproject/abi';
interface Opts {
    network?: string;
    version?: number;
    sleuthDeployer?: string;
}
interface Query<T, A extends any[] = []> {
    bytecode: string;
    callargs?: string;
    fn: FunctionFragment;
}
interface Source {
    name: string;
    address: string;
    iface: Interface;
}
interface SolidityQueryOpts {
    queryFunctionName?: string;
}
interface SolcContract {
    evm?: {
        bytecode?: {
            object: string;
        };
    };
    bytecode?: {
        object: string;
    };
    abi: Fragment[];
}
export declare class Sleuth {
    provider: Provider;
    network: string;
    version: number;
    sleuthAddr: string;
    sources: Source[];
    coder: AbiCoder;
    constructor(provider: Provider, opts?: Opts);
    query<T>(q: string): Query<T, []>;
    static querySol<T, A extends any[] = []>(q: string | object, opts?: SolidityQueryOpts): Query<T, A>;
    static querySolOutput<T, A extends any[] = []>(c: SolcContract, opts?: SolidityQueryOpts): Query<T, A>;
    static querySolSource<T, A extends any[] = []>(q: string, opts?: SolidityQueryOpts): Query<T, A>;
    addSource(name: string, address: string, iface: string[] | Interface): Promise<void>;
    fetch<T, A extends any[] = []>(q: Query<T, A>, args?: A): Promise<T>;
    fetchSql<T>(q: string): Promise<T>;
}
export {};
