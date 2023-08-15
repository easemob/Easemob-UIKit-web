import { action, makeAutoObservable, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
// import client from './agoraChatConfig';
import MessageStore from './MessageStore';
import ConversationStore from './ConversationStore';
import AddressStore from './AddressStore';
import { AgoraChat } from 'agora-chat';
export interface InitConfig {
  appKey: string;
}
export class RootStore {
  messageStore;
  conversationStore;
  addressStore;
  client: AgoraChat.Connection;
  loginState = false;
  initConfig = { appKey: '' };
  constructor() {
    this.client = {} as AgoraChat.Connection;
    this.messageStore = new MessageStore(this);
    this.conversationStore = new ConversationStore(this);
    this.addressStore = new AddressStore();

    makeObservable(this, {
      client: observable,
      loginState: observable,
      setLoginState: action,
      setClient: action,
      initConfig: observable,
      setInitConfig: action,
    });
  }

  setClient(client: AgoraChat.Connection) {
    this.client = client;
  }

  setLoginState(state: boolean) {
    this.loginState = state;
  }

  setInitConfig(initConfig: InitConfig) {
    this.initConfig = initConfig;
  }
}
let store: RootStore;
export function getStore() {
  if (!store) {
    store = new RootStore();
  }
  return store;
}

const rootStore = getStore();
export default rootStore;
