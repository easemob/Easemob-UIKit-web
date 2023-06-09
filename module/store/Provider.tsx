import React, { useEffect, ReactNode, memo, useMemo } from 'react';
import { RootProvider } from './rootContext';
import rootStore from './index';

import AC, { AgoraChat } from 'agora-chat';
import { useEventHandler } from '../hooks/chat';

import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { resource } from '../../local/resource';
export interface ProviderProps {
	initConfig: {
		appKey: string;
		userId?: string;
		password?: string;
	};
	local?: {
		fallbackLng?: string;
		lng: 'zh' | 'en';
		resources?: {
			[key: string]: {
				translation: {
					[key: string]: string;
				};
			};
		};
	};
	children?: ReactNode;
}
const Provider: React.FC<ProviderProps> = (props) => {
	const { initConfig, local } = props;
	const { appKey } = initConfig;
	const client = useMemo(() => {
		return new AC.connection({
			appKey: appKey,
		});
	}, [appKey]);

	console.log('******** 222');

	rootStore.setClient(client);
	rootStore.setInitConfig(initConfig);
	console.log('Provider is run...', appKey);
	useEventHandler();
	let localConfig: any = {
		fallbackLng: 'en',
		lng: 'en',
		resources: resource,
	};
	if (local) {
		localConfig = {
			lng: local.lng,
			fallbackLng: local.fallbackLng || 'en',
			resources: local.resources || resource,
		};
	}
	i18n.use(initReactI18next).init(localConfig);
	console.log('resource', resource);
	// i18n.changeLanguage('zh');
	return (
		<RootProvider
			value={{
				rootStore,
				initConfig,
				client,
			}}
		>
			{props.children}
		</RootProvider>
	);
};

export default memo(Provider);
