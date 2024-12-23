/*
 * @author Stéphane LaFlèche <stephane.l@vanillaforums.com>
 * @copyright 2009-2019 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

import React from "react";
import ConversationsActions from "@library/features/conversations/ConversationsActions";
import FrameHeaderWithAction from "@library/layout/frame/FrameHeaderWithAction";
import { IConversationsStoreState } from "@library/features/conversations/ConversationsModel";
import Loader from "@library/loaders/Loader";
import { buttonUtilityClasses } from "@library/forms/Button.styles";
import { ButtonTypes } from "@library/forms/buttonTypes";
import apiv2 from "@library/apiv2";
import { IMeBoxMessageItem, MeBoxItemType } from "@library/headers/mebox/pieces/MeBoxDropDownItem";
import LinkAsButton from "@library/routing/LinkAsButton";
import MeBoxDropDownItemList from "@library/headers/mebox/pieces/MeBoxDropDownItemList";
import { accessibleLabel, t } from "@library/utility/appUtils";
import Frame from "@library/layout/frame/Frame";
import classNames from "classnames";
import FrameBody from "@library/layout/frame/FrameBody";
import FrameFooter from "@library/layout/frame/FrameFooter";
import { LoadStatus } from "@library/@types/api/core";
import { IConversation, GetConversationsExpand } from "@library/@types/api/conversations";
import { IUserFragment } from "@library/@types/api/users";
import { connect } from "react-redux";
import { ComposeIcon } from "@library/icons/titleBar";
import { IDeviceProps, withDevice } from "@library/layout/DeviceContext";
import Permission from "@library/features/users/Permission";
import { frameBodyClasses } from "@library/layout/frame/frameBodyStyles";
import { CoreErrorMessages } from "@library/errorPages/CoreErrorMessages";

/**
 * Implements Messages Contents to be included in drop down or tabs
 */
export class MessagesContents extends React.Component<MessagesContentsProps> {
    public render() {
        const buttonUtils = buttonUtilityClasses();
        const title = t("Messages");

        return (
            <Frame
                className={this.props.className}
                canGrow={true}
                header={
                    <FrameHeaderWithAction title={title}>
                        <Permission permission="conversations.add">
                            <LinkAsButton
                                title={t("New Message")}
                                to={"/messages/add"}
                                buttonType={ButtonTypes.ICON}
                                className={classNames(buttonUtils.pushRight)}
                            >
                                <ComposeIcon />
                            </LinkAsButton>
                        </Permission>
                    </FrameHeaderWithAction>
                }
                body={<FrameBody className={classNames("isSelfPadded")}>{this.renderContents()}</FrameBody>}
                footer={
                    <FrameFooter>
                        <LinkAsButton
                            className={classNames(buttonUtils.pushLeft)}
                            to={"/messages/inbox"}
                            buttonType={ButtonTypes.TEXT_PRIMARY}
                        >
                            {t("All Messages")}
                        </LinkAsButton>
                    </FrameFooter>
                }
            />
        );
    }

    /**
     * @inheritdoc
     */
    public componentDidMount() {
        if (this.props.status === LoadStatus.PENDING) {
            void this.props.requestData();
        }
    }

    private renderContents(): React.ReactNode {
        const classesFrameBody = frameBodyClasses();
        const { status, data, error } = this.props;

        if (status === LoadStatus.ERROR || error) {
            return (
                <div className={classesFrameBody.noContentMessage}>
                    <CoreErrorMessages apiError={error} />
                </div>
            );
        }

        if (status !== LoadStatus.SUCCESS || !data) {
            return <Loader small minimumTime={0} padding={10} />;
        }

        return (
            <MeBoxDropDownItemList
                emptyMessage={t("You do not have any messages yet.")}
                className="headerDropDown-messages"
                type={MeBoxItemType.MESSAGE}
                data={this.props.data || []}
            />
        );
    }
}

// For clarity, I'm adding className separately because both the container and the content have className, but it's not applied to the same element.
export interface MessageContentsOwnProps extends IDeviceProps {
    className?: string;
    countClass?: string;
    panelBodyClass?: string;
}

export type MessagesContentsProps = MessageContentsOwnProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

/**
 * Update the component state, based on changes to the Redux store.
 *
 * @param state Current Redux store state.
 */
function mapStateToProps(state: IConversationsStoreState) {
    let countUnread = 0;
    const data: IMeBoxMessageItem[] = [];
    const { conversationsByID } = state.conversations;

    if (conversationsByID.data) {
        // Tally the total unread messages. Massage rows into something that will fit into IMeBoxMessageItem.
        for (const conversation of Object.values(conversationsByID.data) as IConversation[]) {
            const authors: IUserFragment[] = [];
            if (conversation.unread === true) {
                countUnread++;
            }
            conversation.participants.forEach((participant) => {
                authors.push(participant.user);
            });

            data.push({
                authors,
                countMessages: conversation.countMessages,
                message: conversation.excerpt,
                photo: conversation.lastMessage!.insertUser.photoUrl || null,
                photoAlt: accessibleLabel(`User: "%s"`, [conversation.lastMessage!.insertUser.name])!,
                to: conversation.url,
                recordID: conversation.conversationID,
                timestamp: conversation.lastMessage!.dateInserted,
                type: MeBoxItemType.MESSAGE,
                unread: conversation.unread,
            });
        }

        // Conversations are indexed by ID, which means they'll be sorted by when they were inserted, ascending. Adjust for that.
        data.sort((itemA: IMeBoxMessageItem, itemB: IMeBoxMessageItem) => {
            const timeA = new Date(itemA.timestamp).getTime();
            const timeB = new Date(itemB.timestamp).getTime();

            if (timeA < timeB) {
                return 1;
            } else if (timeA > timeB) {
                return -1;
            } else {
                return 0;
            }
        });
    }

    return {
        countUnread,
        data,
        status: conversationsByID.status,
        error: conversationsByID.error,
    };
}

/**
 * Create action creators on the component, bound to a Redux dispatch function.
 *
 * @param dispatch Redux dispatch function.
 */
function mapDispatchToProps(dispatch) {
    const convActions = new ConversationsActions(dispatch, apiv2);
    return {
        requestData: () => convActions.getConversations({ expand: GetConversationsExpand.ALL }),
    };
}

// Connect Redux to the React component.
export default connect(mapStateToProps, mapDispatchToProps)(withDevice(MessagesContents));
