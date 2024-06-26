/**
 * @author Adam Charron <adam.c@vanillaforums.com>
 * @copyright 2009-2022 Vanilla Forums Inc.
 * @license gpl-2.0-only
 */

import { IMentionSuggestionData } from "@library/editor/pieces/MentionSuggestion";
import { createCodeBlockEscapePlugin } from "@library/vanilla-editor/plugins/blockEscapePlugin/createCodeBlockEscapePlugin";
import { createBlockquotePlugin } from "@library/vanilla-editor/plugins/blockquotePlugin/createBlockquotePlugin";
import { MentionElement } from "@library/vanilla-editor/plugins/mentionPlugin/MentionElement";
import { createRichEmbedPlugin } from "@library/vanilla-editor/plugins/richEmbedPlugin/createRichEmbedPlugin";
import { ELEMENT_RICH_EMBED_CARD } from "@library/vanilla-editor/plugins/richEmbedPlugin/types";
import { createSpoilerPlugin } from "@library/vanilla-editor/plugins/spoilerPlugin/createSpoilerPlugin";
import { createTablePlugin } from "@library/vanilla-editor/plugins/tablePlugin/createTablePlugin";
import { createMyPlugins, MyEditor, MyPlatePlugin, MyValue } from "@library/vanilla-editor/typescript";
import { createVanillaEditorComponents } from "@library/vanilla-editor/VanillaEditor.components";
import { CONFIG } from "@library/vanilla-editor/VanillaEditor.config";
import { AutoformatPlugin, createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
    createBoldPlugin,
    createCodePlugin,
    createItalicPlugin,
    createStrikethroughPlugin,
} from "@udecode/plate-basic-marks";
import { createExitBreakPlugin, createSoftBreakPlugin } from "@udecode/plate-break";
import { createCodeBlockPlugin } from "@udecode/plate-code-block";
import { createComboboxPlugin, TComboboxItemWithData } from "@udecode/plate-combobox";
import { createHeadingPlugin } from "@udecode/plate-heading";
import { createLinkPlugin, LinkPlugin } from "@udecode/plate-link";
import { createListPlugin, ELEMENT_OL, ELEMENT_UL } from "@udecode/plate-list";
import { createMentionPlugin, MentionPlugin } from "@udecode/plate-mention";
import { createParagraphPlugin } from "@udecode/plate-paragraph";
import { createResetNodePlugin } from "@udecode/plate-reset-node";
import { createSelectOnBackspacePlugin } from "@udecode/plate-select";
import { createDeserializeCsvPlugin } from "@udecode/plate-serializer-csv";
import { createDeserializeDocxPlugin } from "@udecode/plate-serializer-docx";
import { createDeserializeMdPlugin } from "@udecode/plate-serializer-md";
import { createTrailingBlockPlugin } from "@udecode/plate-trailing-block";
import { deserializeMentionHtml } from "@library/vanilla-editor/plugins/mentionPlugin/deserializeMentionHtml";

export const VanillaEditorPlugins = createMyPlugins(
    [
        /**
         * Basic line format.
         *
         * Source
         * @link https://github.com/udecode/plate/blob/main/packages/nodes/paragraph/src/createParagraphPlugin.ts
         */
        createParagraphPlugin(),

        /**
         * Blockquote handling.
         */
        createBlockquotePlugin(),

        /**
         * Spoiler handling.
         */
        createSpoilerPlugin(),

        /**
         * Heading handling
         *
         * @todo https://higherlogic.atlassian.net/browse/VNLA-2656
         *
         * Source.
         * @link https://github.com/udecode/plate/blob/main/packages/nodes/heading/src/createHeadingPlugin.ts
         */
        createHeadingPlugin(),

        /**
         * Link handling.
         *
         * @todo https://higherlogic.atlassian.net/browse/VNLA-2657
         *
         * Source
         * @link https://github.com/udecode/plate/tree/main/packages/nodes/link
         *
         * Plate default UI source.
         * @link https://github.com/udecode/plate/tree/main/packages/ui/nodes/link/src
         */
        createLinkPlugin({} as Partial<MyPlatePlugin<LinkPlugin>>),

        /**
         * List handling (including nesting).
         *
         * Docs
         * @link https://plate.udecode.io/docs/plugins/list
         *
         * Source
         * @link https://github.com/udecode/plate/tree/main/packages/nodes/list/src
         */
        createListPlugin(
            {},
            {
                [ELEMENT_UL]: {
                    options: {
                        validLiChildrenTypes: [ELEMENT_RICH_EMBED_CARD],
                    },
                },
                [ELEMENT_OL]: {
                    options: {
                        validLiChildrenTypes: [ELEMENT_RICH_EMBED_CARD],
                    },
                },
            },
        ),

        /**
         * Table handling
         *
         * @todo Table management UI.
         *
         * Docs
         * @link https://github.com/udecode/plate/tree/main/packages/nodes/list/src
         *
         * Source
         * @link https://github.com/udecode/plate/tree/main/packages/nodes/table/src
         *
         * Plate default UI source.
         * @link https://github.com/udecode/plate/tree/main/packages/ui/nodes/table/src
         */
        createTablePlugin(),

        /**
         * Bring in our own embed plugin.
         *
         * This handles images, links, and file uploads.
         */
        createRichEmbedPlugin(),

        /**
         * Handles code blocks.
         *
         * @todo https://higherlogic.atlassian.net/browse/VNLA-2655
         *
         * Source
         * @link https://github.com/udecode/plate/tree/main/packages/nodes/code-block
         *
         * Plate default UI source.
         * @link https://github.com/udecode/plate/tree/main/packages/ui/nodes/code-block/src/CodeBlockElement
         */
        createCodeBlockPlugin({
            options: {
                syntax: true,
                syntaxPopularFirst: true,
            },
        }),

        createCodeBlockEscapePlugin(),

        /**
         * Simple inline formats.
         */
        createBoldPlugin(),
        createCodePlugin(),
        createItalicPlugin(),
        createStrikethroughPlugin(),

        /**
         * Plugin for handling keyboard shortcuts that transform certain text into others.
         *
         * Docs
         * @link https://plate.udecode.io/docs/plugins/autoformat
         *
         * Source
         * @link https://github.com/udecode/plate/blob/main/packages/editor/autoformat/src/createAutoformatPlugin.ts
         */
        createAutoformatPlugin<AutoformatPlugin<MyValue, MyEditor>, MyValue, MyEditor>(CONFIG.autoformat),

        createResetNodePlugin(CONFIG.resetBlockType),
        createSoftBreakPlugin(CONFIG.softBreak),

        /**
         * Exit Break plugin for handling hotkeys that exit the current block.
         *
         * Docs
         * @link https://plate.udecode.io/docs/plugins/exit-break
         *
         * Source
         * @link https://github.com/udecode/plate/blob/main/packages/editor/break/src/exit-break/createExitBreakPlugin.ts
         */

        createExitBreakPlugin(CONFIG.exitBreak),

        createTrailingBlockPlugin(CONFIG.trailingBlock),
        createSelectOnBackspacePlugin(CONFIG.selectOnBackspace),

        // https://github.com/udecode/plate/tree/main/packages/nodes/mention
        // https://github.com/udecode/plate/tree/main/packages/nodes/mention
        // https://github.com/udecode/plate/tree/main/packages/ui/nodes/mention
        createComboboxPlugin(),

        createMentionPlugin<MentionPlugin<IMentionSuggestionData>, MyValue, MyEditor>({
            key: "@",
            component: MentionElement,
            // pasted HTML from another post will be deserialized into this element
            deserializeHtml: deserializeMentionHtml,
            props: (oldProps) => {
                return {
                    prefix: oldProps.element.type, //use "@" as the prefix
                };
            },
            options: {
                insertSpaceAfterMention: true,
                createMentionNode: (item: TComboboxItemWithData<IMentionSuggestionData>) => {
                    return {
                        ...item.data,
                        value: "", // Useless to us.
                    };
                },
            },
        }),

        /**
         * Paste support.
         */
        createDeserializeMdPlugin(),
        createDeserializeCsvPlugin(),
        createDeserializeDocxPlugin(),
    ],
    {
        /**
         * Wire up our element rendering.
         */
        components: createVanillaEditorComponents(),
    },
);
