import { observable, action, makeObservable } from 'mobx';
import { getStore } from './index';
import { ChatSDK } from '../SDK';
import { getGroupItemIndexFromGroupsById, getGroupMemberIndexByUserId } from '../../module/utils';
import { getUsersInfo } from '../utils';
import { aC } from 'vitest/dist/types-f302dae9';
import { rootStore } from 'chatuim2';
export type MemberRole = 'member' | 'owner' | 'admin';

export interface MemberItem {
  userId: ChatSDK.UserId;
  role: MemberRole;
  // @ts-ignore
  attributes?: ChatSDK.MemberAttributes;
}

export interface GroupItem extends ChatSDK.BaseGroupInfo {
  disabled?: boolean;
  info?: ChatSDK.GroupDetailInfo;
  members?: MemberItem[];
  hasMembersNext?: boolean;
  admins?: ChatSDK.UserId[];
  silent?: boolean;
}

export type AppUserInfo = Partial<Record<ChatSDK.ConfigurableKey, any>> & {
  userId: string;
  isOnline?: boolean;
  presenceExt?: string;
};

export type ChatroomInfo = ChatSDK.GetChatRoomDetailsResult & {
  membersId?: string[];
  admins?: string[];
  muteList?: string[];
};

class AddressStore {
  appUsersInfo: Record<string, AppUserInfo>;
  contacts: { userId: string; nickname: string; silent?: boolean }[];
  groups: GroupItem[];
  hasGroupsNext: boolean;
  chatroom: ChatroomInfo[];
  searchList: any;
  thread: {
    [key: string]: ChatSDK.ThreadChangeInfo[];
  };
  constructor() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
    makeObservable(this, {
      appUsersInfo: observable,
      contacts: observable,
      groups: observable,
      chatroom: observable,
      searchList: observable,
      hasGroupsNext: observable,
      thread: observable,
      setHasGroupsNext: action,
      setContacts: action,
      setGroups: action,
      setGroupMembers: action,
      setGroupMemberAttributes: action,
      setAppUserInfo: action,
      setChatroom: action,
      updateGroupName: action,
      removeGroupMember: action,
      setChatroomAdmins: action,
      setChatroomMuteList: action,
      getChatroomMuteList: action,
      removeUserFromMuteList: action,
      unmuteChatRoomMember: action,
      removerChatroomMember: action,
      getSilentModeForConversations: action,
      clear: action,
    });
  }

  setAppUserInfo = (appUsersInfo: Record<string, AppUserInfo>) => {
    this.appUsersInfo = appUsersInfo;
  };

  setContacts(contacts: any) {
    this.contacts = contacts;
  }

  setGroups(groups: GroupItem[]) {
    let currentGroupsId = this.groups.map(item => item.groupid);
    let filteredGroups = groups.filter(
      ({ groupid }) => !currentGroupsId.find(id => id === groupid),
    );
    this.groups = [...this.groups, ...filteredGroups];
  }

  updateGroupName(groupId: string, groupName: string) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].groupname = groupName;
      this.groups = [...this.groups];
    }
  }

  setHasGroupsNext(hasNext: boolean) {
    this.hasGroupsNext = hasNext;
  }

  setGroupMembers(groupId: string, membersList: ChatSDK.GroupMember[]) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      let currentMembers = this.groups[idx]?.members?.map(item => item.userId);
      let filteredMembers = membersList
        .filter(
          //@ts-ignore
          item => !currentMembers?.find(id => id === (item.owner || item.member)),
        )
        .map<MemberItem>(member => {
          return {
            //@ts-ignore
            userId: member.owner || member.member,
            //@ts-ignore

            role: this.groups[idx].admins?.includes(member.owner || member.member)
              ? 'admin'
              : //@ts-ignore
              member?.owner
              ? 'owner'
              : 'member',
          };
        });
      this.groups[idx].members = [...(this.groups[idx].members || []), ...filteredMembers];
    }
  }

  removeGroupMember(groupId: string, userId: string) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      if (this.groups[idx].members) {
        this.groups[idx].members = this.groups[idx].members?.filter(item => item.userId !== userId);
      }
    }
  }

  setGroupItemHasMembersNext(groupId: string, hasNext: boolean) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].hasMembersNext = hasNext;
    }
  }

  setGroupMemberAttributes(
    groupId: string,
    userId: string,
    // @ts-ignore
    attributes: ChatSDK.MemberAttributes,
  ) {
    let groupIdx = getGroupItemIndexFromGroupsById(groupId);
    let idx = getGroupMemberIndexByUserId(this.groups[groupIdx], userId) ?? -1;
    if (idx > -1) {
      let memberList = this.groups[groupIdx].members || [];
      memberList[idx].attributes = attributes;
    }
  }

  setGroupAdmins = (groupId: string, admins: string[]) => {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].admins = [...admins];
    }
  };

  getUserInfo = (userId: string) => {
    let userInfo: any = this.appUsersInfo?.[userId];
    if (!userInfo) {
      getUsersInfo({ userIdList: [userId] as string[], withPresence: false }).then(() => {
        userInfo = this.appUsersInfo?.[userId];
      });
    }
  };

  getUserInfoWithPresence = (userIdList: string[]) => {
    getUsersInfo({ userIdList });
  };

  setChatroom(chatroom: any) {
    this.chatroom = chatroom;
    // let currentGroupsId = this.groups.map(item => item.groupid);
    // let filteredGroups = groups.filter(
    //   ({ groupid }) => !currentGroupsId.find(id => id === groupid),
    // );
    // this.groups = [...this.groups, ...filteredGroups];
  }

  setChatroomAdmins = (chatroomId: string, admins: string[]) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].admins = [...admins];
    }
  };

  addUserToMuteList = (chatroomId: string, userId: string) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = [...muteList, userId];
    }
  };

  setChatroomMuteList = (chatroomId: string, muteList: string[]) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      console.log('找到了', this.chatroom[idx]);
      this.chatroom[idx].muteList = [...muteList];
      console.log('找到了', this.chatroom[idx]);
    }
  };

  muteChatRoomMember = (chatroomId: string, userId: string, muteDuration?: number) => {
    if (!chatroomId || !userId) throw 'chatroomId or userId is empty';
    const rootStore = getStore();
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      if (muteList.includes(userId)) return Promise.resolve();
    }
    return rootStore.client
      .muteChatRoomMember({
        chatRoomId: chatroomId,
        username: userId, //message.from as string,
        muteDuration: muteDuration || 60 * 60 * 24 * 30,
      })
      .then(res => {
        console.log('禁言成功', res);
        this.addUserToMuteList(chatroomId, userId);
      });
  };

  getChatroomMuteList = (chatroomId: string) => {
    if (!chatroomId) throw 'chatroomId is empty';
    const rootStore = getStore();
    return rootStore.client.getChatRoomMutelist({ chatRoomId: chatroomId }).then(res => {
      console.log('获取禁言列表成功', res);
      const muteList = res.data?.map(item => item.user) || [];
      this.setChatroomMuteList(chatroomId, muteList);
    });
  };

  unmuteChatRoomMember = (chatroomId: string, userId: string) => {
    if (!chatroomId || !userId) throw 'chatroomId or userId is empty';
    const rootStore = getStore();
    return rootStore.client
      .unmuteChatRoomMember({
        chatRoomId: chatroomId,
        username: userId, //message.from as string,
      })
      .then(res => {
        console.log('取消禁言成功', res);
        this.removeUserFromMuteList(chatroomId, userId);
      });
  };
  removeUserFromMuteList = (chatroomId: string, userId: string) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = muteList.filter(item => item !== userId);
    }
  };

  setChatroomMemberIds = (chatroomId: string, membersId: string[]) => {
    console.log('设置 --', membersId);
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].membersId = [
        ...new Set([...(this.chatroom[idx].membersId || []), ...membersId]),
      ];
    }
  };

  removerChatroomMember = (chatroomId: string, userId: string) => {
    const rootStore = getStore();
    rootStore.client
      .removeChatRoomMember({
        chatRoomId: chatroomId,
        username: userId,
      })
      .then(() => {
        let idx = this.chatroom.findIndex(item => item.id === chatroomId);
        if (idx > -1) {
          this.chatroom[idx].membersId = this.chatroom[idx].membersId?.filter(
            item => item !== userId,
          );
        }
        console.log('移除成功');
      });
  };

  setSearchList(searchList: any) {
    this.searchList = searchList;
  }

  getSilentModeForConversations(
    cvs: { conversationId: string; chatType: 'singleChat' | 'groupChat' }[],
  ) {
    if (!cvs || cvs.length == 0) {
      return;
    }
    const cvsList = cvs.map(item => {
      return {
        id: item.conversationId,
        type: item.chatType,
      };
    });
    const rootStore = getStore();
    rootStore.client
      .getSilentModeForConversations({
        conversationList: cvsList,
      })
      .then((res: any) => {
        console.log('获取勿扰成功', res);
        const userSetting = res.data.user;
        const groupSetting = res.data.group;
        this.contacts.forEach(item => {
          if (userSetting[item.userId] && userSetting[item.userId]?.type == 'NONE') {
            item.silent = true;
          } else if (userSetting[item.userId]) {
            item.silent = false;
          }
        });
        console.log('this.contacts', this.contacts);
        this.groups.forEach(item => {
          if (groupSetting[item.groupid] && groupSetting[item.groupid]?.type == 'AT') {
            item.silent = true;
          } else if (groupSetting[item.groupid]) {
            item.silent = false;
          }
        });
      });
  }

  setSilentModeForConversation(
    cvs: { conversationId: string; chatType: 'singleChat' | 'groupChat' },
    silent: boolean,
  ) {
    const rootStore = getStore();
    if (silent) {
      rootStore.client
        .setSilentModeForConversation({
          conversationId: cvs.conversationId,
          type: cvs.chatType as ChatSDK.CONVERSATIONTYPE,
          options: {
            paramType: 0,
            remindType: (cvs.chatType == 'groupChat' ? 'AT' : 'NONE') as ChatSDK.SILENTMODETYPE,
          },
        })
        .then((res: any) => {
          console.log('设置勿扰成功', res);
          if (cvs.chatType === 'singleChat') {
            this.contacts.forEach(item => {
              if (item.userId === cvs.conversationId) {
                item.silent = true;
              }
            });
          } else if (cvs.chatType === 'groupChat') {
            this.groups.forEach(item => {
              if (item.groupid === cvs.conversationId) {
                item.silent = true;
              }
            });
          }
          // 不同同步会话列表里的数据， 因为会话列表里的数据每次都会重新获取， 同理在会话列表设置后也不要同步联系人列表里的数据，后面优化
        });
    } else {
      rootStore.client
        .clearRemindTypeForConversation({
          conversationId: cvs.conversationId,
          type: cvs.chatType as ChatSDK.CONVERSATIONTYPE,
        })
        .then((res: any) => {
          console.log('清除勿扰成功', res);
          if (cvs.chatType === 'singleChat') {
            this.contacts.forEach(item => {
              if (item.userId === cvs.conversationId) {
                item.silent = false;
              }
            });
          } else if (cvs.chatType === 'groupChat') {
            this.groups.forEach(item => {
              if (item.groupid === cvs.conversationId) {
                item.silent = false;
              }
            });
          }
        });
    }
  }

  clear() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
  }
}

export default AddressStore;
