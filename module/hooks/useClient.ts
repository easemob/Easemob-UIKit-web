import {
	useCallback,
	useEffect,
	MutableRefObject,
	useContext,
	useState,
} from 'react';
import AC from 'agora-chat';
import { RootContext } from '../store/rootContext';
const useClient = () => {
	const rootStore = useContext(RootContext).rootStore;

	let [client, setClient] = useState<any>(rootStore.client);
	console.log('生成 client');
	return rootStore.client;
};

export { useClient };
