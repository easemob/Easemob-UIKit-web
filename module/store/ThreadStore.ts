import { makeAutoObservable, observable, action, makeObservable } from 'mobx';
import { AgoraChat } from 'agora-chat';
import { A } from 'vitest/dist/types-71ccd11d';

export interface Thread {
  [key: string]: {
    [key: string]: {
      info?: AgoraChat.ThreadChangeInfo & { owner?: string };
      originalMessage: AgoraChat.MessageBody;
    };
  };
}

export interface CurrentThread {
  visible: boolean;
  creating: boolean;
  info?: AgoraChat.ThreadChangeInfo & { owner?: string; members?: string[] };
  originalMessage: AgoraChat.MessageBody;
}

class ThreadStore {
  rootStore;
  thread: Thread;
  currentThread: CurrentThread;
  showThreadPanel: boolean;
  threadList: { [key: string]: (AgoraChat.ChatThreadDetail & { members?: string[] })[] };
  constructor(rootStore: any) {
    this.rootStore = rootStore;
    this.thread = {};
    this.currentThread = {} as CurrentThread;
    this.showThreadPanel = false;
    this.threadList = {};

    makeObservable(this, {
      thread: observable,
      currentThread: observable,
      showThreadPanel: observable,
      threadList: observable,
      setThread: action,

      setCurrentThread: action,
      setThreadVisible: action,
      updateThreadInfo: action,
      updateMultiDeviceEvent: action,
      getChatThreadDetail: action,
    });
  }

  setThread(thread: Thread) {
    this.thread = { ...this.thread, ...thread };
    console.log(this.thread);
  }

  setCurrentThread(thread: CurrentThread) {
    console.log('setCurrentThread --->', thread);
    this.currentThread = thread;

    console.log('更新后', this.currentThread);
  }

  setThreadVisible(visible: boolean) {
    this.showThreadPanel = visible;
  }

  updateThreadInfo(threadInfo: AgoraChat.ThreadChangeInfo) {
    //   {
    //     "id": "222635276435457",
    //     "name": "一个子区",
    //     "parentId": "211519172313089",
    //     "messageId": "1177487158236154628",
    //     "timestamp": 1691719945703,
    //     "operator": "zd2",
    //     "operation": "create",
    //     "createTimestamp": 1691719945703,
    //     "messageCount": 0
    // }
    console.log('updateThreadInfo --->', threadInfo);
    let chatThreadOverview: AgoraChat.ThreadChangeInfo | undefined;

    const { operation, messageId, parentId, id, operator } = threadInfo;
    const currentThreadInfo = this.currentThread.info;
    const originalMessage = this.currentThread.originalMessage;
    // @ts-ignore
    const orgMsgId = originalMessage?.mid || originalMessage?.id;

    let foundThread: AgoraChat.ThreadChangeInfo = {} as AgoraChat.ThreadChangeInfo;

    if (operation != 'create') {
      this.threadList[parentId]?.forEach(item => {
        if (item.id === id) {
          // @ts-ignore
          foundThread = item;
        }
      });
    }

    switch (operation) {
      case 'create':
        chatThreadOverview = threadInfo;
        // others create the chatThread of this message when I am creating the chatThread
        if (
          (messageId === currentThreadInfo?.messageId || orgMsgId === messageId) &&
          this.rootStore.client.context.userId !== operator
        ) {
          // message.warn(i18next.t('Someone else created a thread for this message'));
          this.setCurrentThread({
            visible: false,
            creating: false,
            info: undefined,
            originalMessage: {} as AgoraChat.MessageBody,
          });
        }
        break;
      case 'update':
        if (messageId === currentThreadInfo?.messageId || orgMsgId === messageId) {
          this.setCurrentThread({
            ...this.currentThread,
            // owner: threadInfo.operator,
            creating: false,
            info: { ...threadInfo, owner: threadInfo.operator },
          });
        }
        chatThreadOverview = threadInfo;

        if (!foundThread) return;
        let newThread = {
          ...foundThread,
          name: threadInfo.name,
        };
        threadInfo.lastMessage ? (newThread.lastMessage = threadInfo.lastMessage) : null;

        this.threadList[parentId]?.splice(
          this.threadList[parentId]?.indexOf(foundThread),
          1,
          newThread,
        );
        break;

      case 'destroy':
      case 'userRemove':
        chatThreadOverview = undefined;
        if (id === currentThreadInfo?.id) {
          this.setCurrentThread({
            visible: false,
            creating: false,
            info: undefined,
            originalMessage: {} as AgoraChat.MessageBody,
          });

          // const warnText = operation === 'userRemove' ? t('You have been removed from the thread') : t('The thread has been disbanded')
          this.setThreadVisible(false);

          this.threadList[parentId]?.splice(this.threadList[parentId]?.indexOf(foundThread), 1);
        }

        break;
      default:
        break;
    }

    // add chatThreadOverview into original message, or update chatThreadOverview

    const message = this.rootStore.messageStore.message['groupChat'][parentId as string];

    message.forEach((item: any) => {
      if (item.mid === messageId || item.id === messageId) {
        item.chatThreadOverview = chatThreadOverview;
      }
    });

    console.log('更新后', this.currentThread);
  }

  //thread member received changed
  updateMultiDeviceEvent(msg: any) {
    const currentThreadInfo = this.currentThread.info;
    if (msg.operation === 'chatThreadLeave' && currentThreadInfo?.id === msg.chatThreadId) {
      this.setCurrentThread({
        ...this.currentThread,
        visible: false,
      });

      this.setThreadVisible(false);
    }
  }

  getChatThreadDetail(threadId: string) {
    if (!threadId) return;
    const currentThreadInfo = this.currentThread.info;
    if (currentThreadInfo) {
      this.rootStore.client.getChatThreadDetail({ chatThreadId: threadId }).then((res: any) => {
        console.log('getChatThreadDetail --->', res);
        this.setCurrentThread({
          ...this.currentThread,
          info: {
            ...currentThreadInfo,
            // @ts-ignore
            owner: res.data.owner,
          },
        });
      });
    }
  }

  getThreadMembers(parentId: string, threadId: string) {
    if (!parentId || !threadId) return;
    return this.rootStore.client
      .getChatThreadMembers({
        chatThreadId: threadId,
        pageSize: 50,
      })
      .then((res: { data: { affiliations: string[] } }) => {
        console.log('获取thread members成功', res);
        const members = res.data.affiliations;

        if (!this.threadList[parentId]) {
          this.threadList[parentId] = [
            {
              id: threadId,
              parentId: parentId,
              members,
              name: '',
              owner: '',
              created: 0,
              messageId: '',
            },
          ];
        }
        this.threadList[parentId]?.forEach(item => {
          if (item.id === threadId) {
            item.members = members;
          }
        });

        if (this.currentThread.info?.id === threadId) {
          this.currentThread.info.members = members;
        }
        return members;
      });
  }

  removeChatThreadMember(parentId: string, threadId: string, userId: string) {
    if (!parentId || !threadId || !userId) return;
    return this.rootStore.client
      .removeChatThreadMember({
        chatThreadId: threadId,
        username: userId,
      })
      .then((res: any) => {
        console.log('removeChatThreadMember --->', res);
        this.getThreadMembers(parentId, threadId);
      });
  }

  joinChatThread(chatThreadId: string) {
    if (!chatThreadId) return;
    return this.rootStore.client.joinChatThread({ chatThreadId }).then((res: any) => {
      console.log('joinChatThread --->', res);
      // this.getThreadMembers('', chatThreadId);
    });
  }
}

export default ThreadStore;