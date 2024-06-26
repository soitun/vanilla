/**
 * @copyright 2009-2024 Vanilla Forums Inc.
 * @license Proprietary
 */

import { STORY_DATE_ENDS, STORY_DATE_STARTS } from "@library/storybook/storyData";
import {
    IAutomationRule,
    IAutomationRuleAction,
    IAutomationRuleDispatch,
    IAutomationRuleTrigger,
    IAutomationRulesCatalog,
} from "@dashboard/automationRules/AutomationRules.types";
import { CategoryDisplayAs } from "@vanilla/addon-vanilla/categories/categoriesTypes";
import { ProfileFieldsFixtures } from "@dashboard/userProfiles/components/ProfileFields.fixtures";
import { ProfileFieldFormType, ProfileFieldVisibility } from "@dashboard/userProfiles/types/UserProfiles.types";

export const mockRecipesList: IAutomationRule[] = [
    {
        automationRuleID: 1,
        name: "Test Automation Rule 1",
        automationRuleRevisionID: 1,
        dateInserted: STORY_DATE_STARTS,
        insertUserID: 2,
        updateUserID: 2,
        dateUpdated: STORY_DATE_STARTS,
        dateLastRun: STORY_DATE_ENDS,
        status: "active",
        recentDispatch: {
            dispatchStatus: "success",
        },
        trigger: {
            triggerType: "emailDomainTrigger",
            triggerName: "trigger1Name",
            triggerValue: {},
        },
        action: {
            actionType: "categoryFollowAction",
            actionName: "action1Name",
            actionValue: {},
        },
    },
    {
        automationRuleID: 2,
        name: "Test Automation Rule 2",
        automationRuleRevisionID: 2,
        dateInserted: STORY_DATE_STARTS,
        insertUserID: 2,
        updateUserID: 2,
        dateUpdated: STORY_DATE_STARTS,
        dateLastRun: STORY_DATE_ENDS,
        status: "inactive",
        recentDispatch: {
            dispatchStatus: "queued",
        },
        trigger: {
            triggerType: "staleDiscussionTrigger",
            triggerName: "trigger2Name",
            triggerValue: {
                triggerTimeThreshold: "1",
                triggerTimeUnit: "day",
                postType: ["discussion"],
            },
        },
        action: {
            actionType: "closeDiscussionAction",
            actionName: "action2Name",
            actionValue: {},
        },
    },
    {
        automationRuleID: 3,
        name: "Test Automation Rule 3",
        automationRuleRevisionID: 3,
        dateInserted: STORY_DATE_STARTS,
        insertUserID: 2,
        updateUserID: 2,
        dateUpdated: STORY_DATE_STARTS,
        dateLastRun: STORY_DATE_ENDS,
        status: "active",
        recentDispatch: {
            dispatchStatus: "queued",
        },
        trigger: {
            triggerType: "profileFieldTrigger",
            triggerName: "trigger3Name",
            triggerValue: {
                profileField: {
                    test_text_profileField: "test_text",
                },
            },
        },
        action: {
            actionType: "addRemoveRoleAction",
            actionName: "action3Name",
            actionValue: {
                addRoleID: 2,
                removeRoleID: 3,
            },
        },
    },
    {
        automationRuleID: 4,
        name: "Test Automation Rule 4",
        automationRuleRevisionID: 4,
        dateInserted: STORY_DATE_STARTS,
        insertUserID: 2,
        updateUserID: 2,
        dateUpdated: STORY_DATE_STARTS,
        dateLastRun: STORY_DATE_ENDS,
        status: "inactive",
        recentDispatch: {
            dispatchStatus: "queued",
        },
        trigger: {
            triggerType: "emailDomainTrigger",
            triggerName: "trigger4Name",
            triggerValue: {
                emailDomain: "example.com, test.com",
            },
        },
        action: {
            actionType: "categoryFollowAction",
            actionName: "action4Name",
            actionValue: {
                categoryID: [1, 2],
            },
        },
    },
    {
        automationRuleID: 5,
        name: "Test Automation Rule 5",
        automationRuleRevisionID: 5,
        dateInserted: STORY_DATE_STARTS,
        insertUserID: 2,
        updateUserID: 2,
        dateUpdated: STORY_DATE_STARTS,
        dateLastRun: STORY_DATE_ENDS,
        status: "inactive",
        recentDispatch: {
            dispatchStatus: "queued",
        },
        trigger: {
            triggerType: "staleDiscussionTrigger",
            triggerName: "trigger5Name",
            triggerValue: {
                duration: "2",
                interval: "hour",
                postType: ["discussion", "question"],
            },
        },
        action: {
            actionType: "moveToCategoryAction",
            actionName: "action5Name",
            actionValue: {
                categoryID: [1, 2],
            },
        },
    },
];

export const mockDispatches: IAutomationRuleDispatch[] = [
    {
        automationRuleDispatchUUID: `some_uuid_${mockRecipesList[0].automationRuleID}`,
        insertUser: { userID: 2, name: "test_user", dateLastActive: mockRecipesList[0].dateInserted, photoUrl: "" },
        updateUser: { userID: 2, name: "test_user", dateLastActive: mockRecipesList[0].dateInserted, photoUrl: "#" },
        dateDispatched: mockRecipesList[0].dateLastRun,
        dateFinished: mockRecipesList[0].dateLastRun,
        dispatchStatus: "success",
        automationRule: mockRecipesList[0],
        trigger: mockRecipesList[0].trigger,
        action: mockRecipesList[0].action,
        dispatchType: "triggered",
        dispatchUser: { userID: 2, name: "test_user", dateLastActive: mockRecipesList[0].dateInserted, photoUrl: "" },
        affectedRows: {
            user: 1,
        },
    },
    {
        automationRuleDispatchUUID: `some_uuid_${mockRecipesList[1].automationRuleID}`,
        insertUser: { userID: 2, name: "test_user", dateLastActive: mockRecipesList[1].dateInserted, photoUrl: "" },
        updateUser: { userID: 2, name: "test_user", dateLastActive: mockRecipesList[1].dateInserted, photoUrl: "#" },
        dateDispatched: mockRecipesList[1].dateLastRun,
        dateFinished: mockRecipesList[1].dateLastRun,
        dispatchStatus: "queued",
        automationRule: mockRecipesList[1],
        trigger: mockRecipesList[1].trigger,
        action: mockRecipesList[1].action,
        dispatchType: "manual",
        dispatchUser: { userID: 2, name: "test_user", dateLastActive: mockRecipesList[0].dateInserted, photoUrl: "" },
        affectedRows: {
            user: 1,
        },
    },
];

const timeInputsSchemaProperties = {
    maxTimeThreshold: {
        type: "integer",
        minimum: 1,
        step: 1,
        "x-control": {
            description: "Any data older than this will be excluded from triggering the rule.",
            label: "Max Time Threshold",
            inputType: "textBox",
            placeholder: "",
            type: "number",
            tooltip: "",
        },
    },
    maxTimeUnit: {
        type: "string",
        enum: ["hour", "day", "week", "year"],
        "x-control": {
            description: "Select the time unit.",
            label: "Max Time Unit",
            inputType: "dropDown",
            placeholder: "",
            choices: {
                staticOptions: {
                    hour: "Hour",
                    day: "Day",
                    week: "Week",
                    year: "Year",
                },
            },
            multiple: false,
            tooltip: "",
        },
    },
    triggerTimeThreshold: {
        type: "integer",
        minimum: 1,
        step: 1,
        "x-control": {
            description: "Set the duration after which the rule will trigger.",
            label: "Trigger Time Threshold",
            inputType: "textBox",
            placeholder: "",
            type: "number",
            tooltip: "",
        },
    },
    triggerTimeUnit: {
        type: "string",
        enum: ["hour", "day", "week", "year"],
        "x-control": {
            description: "Select the time unit.",
            label: "Trigger Time Unit",
            inputType: "dropDown",
            placeholder: "",
            choices: {
                staticOptions: {
                    hour: "Hour",
                    day: "Day",
                    week: "Week",
                    year: "Year",
                },
            },
            multiple: false,
            tooltip: "",
        },
    },
};

export const mockAutomationRulesCatalog: IAutomationRulesCatalog = {
    triggers: {
        emailDomainTrigger: {
            triggerType: "emailDomainTrigger",
            name: "Email Domain Trigger Name",
            triggerActions: ["addRemoveRoleAction", "categoryFollowAction"],
            schema: {
                type: "object",
                properties: {
                    emailDomain: {
                        type: "string",
                        "x-control": {
                            description: "Enter one or more comma-separated email domains",
                            label: "Email Domain",
                            inputType: "textBox",
                            placeholder: "",
                            type: "string",
                            tooltip: "",
                        },
                    },
                },
                required: ["emailDomain"],
            },
        } as IAutomationRuleTrigger,
        profileFieldTrigger: {
            triggerType: "profileFieldTrigger",
            name: "ProfileField Trigger Name",
            triggerActions: ["addRemoveRoleAction"],
            schema: {
                type: "object",
                properties: {
                    profileField: {
                        type: "string",
                        "x-control": {
                            description: "Select a profile field",
                            label: "Profile Field",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/profile-fields?enabled=true",
                                    singleUrl: "",
                                    valueKey: "apiName",
                                    labelKey: "label",
                                    extraLabelKey: null,
                                },
                            },
                            multiple: false,
                            tooltip: "",
                        },
                    },
                },
                required: ["profileField"],
            },
        } as IAutomationRuleTrigger,
        staleDiscussionTrigger: {
            triggerType: "staleDiscussionTrigger",
            name: "A certain amount of time has passed since a post has been created but has not received any comments",
            triggerActions: [
                "closeDiscussionAction",
                "bumpDiscussionAction",
                "addTagAction",
                "moveToCategoryAction",
                "addToCollectionAction",
                "removeDiscussionFromCollectionAction",
            ],
            schema: {
                type: "object",
                properties: {
                    ...timeInputsSchemaProperties,
                    postType: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                        default: ["discussion", "question"],
                        enum: ["discussion", "question"],
                        "x-control": {
                            description: "Select a post type.",
                            label: "Post Type",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                staticOptions: {
                                    discussion: "Discussion",
                                    question: "Question",
                                },
                            },
                            multiple: true,
                            tooltip: "",
                        },
                    },
                },
                required: ["maxTimeThreshold", "maxTimeUnit", "triggerTimeThreshold", "triggerTimeUnit", "postType"],
            },
        },
        lastActiveDiscussionTrigger: {
            triggerType: "lastActiveDiscussionTrigger",
            name: "A certain amount of time has passed since a post has been active.",
            triggerActions: [
                "closeDiscussionAction",
                "bumpDiscussionAction",
                "addTagAction",
                "moveToCategoryAction",
                "addToCollectionAction",
                "removeDiscussionFromCollectionAction",
            ],
            schema: {
                type: "object",
                properties: {
                    ...timeInputsSchemaProperties,
                    postType: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                        default: ["discussion", "question"],
                        enum: ["discussion", "question"],
                        "x-control": {
                            description: "Select a post type.",
                            label: "Post Type",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                staticOptions: {
                                    discussion: "Discussion",
                                    question: "Question",
                                },
                            },
                            multiple: true,
                            tooltip: "",
                        },
                    },
                },
                required: ["maxTimeThreshold", "maxTimeUnit", "triggerTimeThreshold", "triggerTimeUnit", "postType"],
            },
        },
        staleCollectionTrigger: {
            triggerType: "staleCollectionTrigger",
            name: "A certain amount of time has passed since a post added to a collection",
            triggerActions: ["removeDiscussionFromTriggerCollectionAction"],
            schema: {
                type: "object",
                properties: timeInputsSchemaProperties,
                required: ["maxTimeThreshold", "maxTimeUnit", "triggerTimeThreshold", "triggerTimeUnit"],
            },
        },
        timeSinceUserRegistrationTrigger: {
            triggerType: "timeSinceUserRegistrationTrigger",
            name: "A certain amount of time has passed since a user registered",
            triggerActions: ["addRemoveRoleAction"],
            schema: {
                type: "object",
                properties: timeInputsSchemaProperties,
                required: ["maxTimeThreshold", "maxTimeUnit", "triggerTimeThreshold", "triggerTimeUnit"],
            },
        },
        ideationVoteTrigger: {
            triggerType: "ideationVoteTrigger",
            name: "An idea receives a certain number of votes",
            triggerActions: ["changeIdeationStatusAction"],
            schema: {
                type: "object",
                properties: {
                    score: {
                        type: "integer",
                        "x-control": {
                            description:
                                "Enter the number of votes that a idea should receive to trigger this automation rule. Whole numbers only.",
                            label: "Number of votes",
                            inputType: "textBox",
                            placeholder: "",
                            type: "number",
                            tooltip: "",
                        },
                    },
                },
                required: ["score"],
            },
        },
    },
    actions: {
        categoryFollowAction: {
            actionType: "categoryFollowAction",
            name: "Category Follow Action Name",
            actionTriggers: ["emailDomainTrigger", "profileFieldTrigger"],
            schema: {
                type: "object",
                properties: {
                    categoryID: {
                        type: "array",
                        items: {
                            type: "integer",
                        },
                        "x-control": {
                            description: "Select one or more categories to follow",
                            label: "Category to Follow",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/categories",
                                    singleUrl: "/api/v2/categories/%s",
                                    valueKey: "categoryID",
                                    labelKey: "name",
                                    extraLabelKey: null,
                                },
                            },
                            multiple: true,
                            tooltip: "",
                        },
                    },
                },
                required: ["categoryID"],
            },
        } as IAutomationRuleAction,
        moveToCategoryAction: {
            actionType: "moveToCategoryAction",
            name: "Move to a specific category",
            actionTriggers: ["staleDiscussionTrigger", "lastActiveDiscussionTrigger"],
            schema: {
                type: "object",
                properties: {
                    categoryID: {
                        type: "array",
                        items: {
                            type: "integer",
                        },
                        "x-control": {
                            description: "Select a category",
                            label: "Category to move to",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/categories/search?query=%s&limit=30",
                                    singleUrl: "/api/v2/categories/%s",
                                    valueKey: "categoryID",
                                    labelKey: "name",
                                },
                            },
                            multiple: false,
                            tooltip: "",
                        },
                    },
                },
                required: ["categoryID"],
            },
        },
        closeDiscussionAction: {
            actionType: "closeDiscussionAction",
            name: "Close the discussion",
            actionTriggers: ["staleDiscussionTrigger", "lastActiveDiscussionTrigger"],
        },
        bumpDiscussionAction: {
            actionType: "bumpDiscussionAction",
            name: "Bump the discussion",
            actionTriggers: ["staleDiscussionTrigger", "lastActiveDiscussionTrigger"],
        },
        addTagAction: {
            actionType: "addTagAction",
            name: "Add a tag",
            actionTriggers: ["staleDiscussionTrigger", "lastActiveDiscussionTrigger"],
            schema: {
                type: "object",
                properties: {
                    tagID: {
                        type: "array",
                        items: {
                            type: "integer",
                        },
                        "x-control": {
                            description: "Select one or more tags",
                            label: "Tags to add",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/tags?type=User&limit=30&query=%s",
                                    singleUrl: "/api/v2/tags/%s",
                                    valueKey: "tagID",
                                    labelKey: "name",
                                },
                            },
                            multiple: true,
                            tooltip: "",
                        },
                    },
                },
                required: ["tagID"],
            },
        },
        addToCollectionAction: {
            actionType: "addToCollectionAction",
            name: "Add to collection",
            actionTriggers: ["staleDiscussionTrigger", "lastActiveDiscussionTrigger"],
            schema: {
                type: "object",
                properties: {
                    collectionID: {
                        type: "array",
                        items: {
                            type: "integer",
                        },
                        "x-control": {
                            description: "Select one or more collections.",
                            label: "Collection to add to",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/collections",
                                    singleUrl: "/api/v2/collections/%s",
                                    valueKey: "collectionID",
                                    labelKey: "name",
                                },
                            },
                            multiple: true,
                            tooltip: "",
                        },
                    },
                },
                required: ["collectionID"],
            },
        },
        removeDiscussionFromCollectionAction: {
            actionType: "removeDiscussionFromCollectionAction",
            name: "Remove from collection",
            actionTriggers: ["staleDiscussionTrigger", "lastActiveDiscussionTrigger"],
            schema: {
                type: "object",
                properties: {
                    collectionID: {
                        type: "array",
                        items: {
                            type: "integer",
                        },
                        "x-control": {
                            description: "Select one or more collections.",
                            label: "Collection to remove from",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/collections",
                                    singleUrl: "/api/v2/collections/%s",
                                    valueKey: "collectionID",
                                    labelKey: "name",
                                },
                            },
                            multiple: true,
                            tooltip: "",
                        },
                    },
                },
                required: ["collectionID"],
            },
        },
        removeDiscussionFromTriggerCollectionAction: {
            actionType: "removeDiscussionFromTriggerCollectionAction",
            name: "Remove from trigger collection",
            actionTriggers: ["staleCollectionTrigger"],
        },
        addRemoveRoleAction: {
            actionType: "addRemoveRoleAction",
            name: "Role Action Name",
            actionTriggers: ["profileFieldTrigger"],
            schema: {
                type: "object",
                properties: {
                    addRoleID: {
                        type: "string",
                        "x-control": {
                            description: "Select a role to be assigned",
                            label: "Assign Role",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/roles",
                                    singleUrl: "/api/v2/roles/%s",
                                    valueKey: "roleID",
                                    labelKey: "name",
                                    extraLabelKey: null,
                                },
                            },
                            multiple: false,
                            tooltip: "",
                        },
                    },
                    removeRoleID: {
                        type: "string",
                        "x-control": {
                            description: "Select a role to be removed",
                            label: "Remove Role (optional)",
                            inputType: "dropDown",
                            placeholder: "",
                            choices: {
                                api: {
                                    searchUrl: "/api/v2/roles",
                                    singleUrl: "/api/v2/roles/%s",
                                    valueKey: "roleID",
                                    labelKey: "name",
                                    extraLabelKey: null,
                                },
                            },
                            multiple: false,
                            tooltip: "",
                        },
                    },
                },
                required: ["addRoleID"],
            },
        } as IAutomationRuleAction,
        changeIdeationStatusAction: {
            actionType: "changeIdeationStatusAction",
            name: "Change the ideation status",
            actionTriggers: ["ideationVoteTrigger"],
        },
    },
};

export const mockCategoriesData = [
    {
        categoryID: 1,
        name: "Mock Category 1",
        url: "/mock-category",
        description: "mock category description",
        parentCategoryID: null,
        customPermissions: false,
        isArchived: false,
        urlcode: "/",
        displayAs: CategoryDisplayAs.DEFAULT,
        countCategories: 1,
        countDiscussions: 10,
        countComments: 10,
        countAllDiscussions: 10,
        countAllComments: 10,
        followed: false,
        depth: 1,
        children: [],
        dateInserted: new Date("2023-06-16").toUTCString(),
    },
    {
        categoryID: 2,
        name: "Mock Category 2",
        url: "/mock-category-2",
        description: "mock category 2 description",
        parentCategoryID: null,
        customPermissions: false,
        isArchived: false,
        urlcode: "/",
        displayAs: CategoryDisplayAs.DEFAULT,
        countCategories: 1,
        countDiscussions: 10,
        countComments: 10,
        countAllDiscussions: 10,
        countAllComments: 10,
        followed: false,
        depth: 1,
        children: [],
        dateInserted: new Date("2023-06-16").toUTCString(),
    },
];

export const mockProfileField = ProfileFieldsFixtures.mockProfileField(ProfileFieldFormType.TEXT, {
    apiName: "test_text_profileField",
    displayOptions: {
        search: false,
    },
    enabled: true,
    visibility: ProfileFieldVisibility.PUBLIC,
});
