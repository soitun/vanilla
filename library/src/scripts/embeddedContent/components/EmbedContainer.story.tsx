/**
 * @author Adam Charron <adam.c@vanillaforums.com>
 * @copyright 2009-2019 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

import { EmbedContainer } from "@library/embeddedContent/components/EmbedContainer";
import { EmbedContainerSize } from "@library/embeddedContent/components/EmbedContainerSize";
import { StoryHeading } from "@library/storybook/StoryHeading";
import React from "react";
import { EmbedContext } from "@library/embeddedContent/IEmbedContext";

export default {
    title: "Embeds/Pieces",
};

const ipsum = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce blandit lorem ac dui porta, scelerisque placerat felis finibus. Fusce vitae porttitor augue. Integer sagittis justo vitae nibh aliquet, a viverra ipsum laoreet. Interdum et malesuada fames ac ante ipsum primis in faucibus. Curabitur elit ligula, fermentum nec felis vel, aliquam interdum justo. Suspendisse et egestas neque. Vivamus volutpat odio eget enim tincidunt, in pretium arcu consectetur. Nulla sodales molestie pharetra.
`;

export const _EmbedContainer = () => {
    return (
        <>
            <StoryHeading depth={1}>COMPONENT: EmbedContainer</StoryHeading>

            <StoryHeading>Small</StoryHeading>
            <EmbedContainer size={EmbedContainerSize.SMALL}>{ipsum}</EmbedContainer>

            <StoryHeading>Medium</StoryHeading>
            <EmbedContainer size={EmbedContainerSize.MEDIUM}>{ipsum}</EmbedContainer>

            <StoryHeading>Full Width</StoryHeading>
            <EmbedContainer size={EmbedContainerSize.FULL_WIDTH}>{ipsum}</EmbedContainer>

            <StoryHeading>Editor Mode (selection/pointer-events blocked)</StoryHeading>
            <EmbedContext.Provider value={{ inEditor: true }}>
                <EmbedContainer>{ipsum}</EmbedContainer>
            </EmbedContext.Provider>
        </>
    );
};

_EmbedContainer.story = {
    name: "EmbedContainer",
};
