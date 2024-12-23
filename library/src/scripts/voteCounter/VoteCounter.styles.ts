/**
 * @author Mihran Abrahamian <mihran.abrahamian@vanillaforums.com>
 * @copyright 2009-2021 Vanilla Forums Inc.
 * @license gpl-2.0-only
 */

import { css } from "@emotion/css";
import { CSSObject } from "@emotion/css/types/create-instance";
import { ColorsUtils } from "@library/styles/ColorsUtils";
import { globalVariables } from "@library/styles/globalStyleVars";
import { useThemeCache } from "@library/styles/themeCache";
import voteCounterVariables from "@library/voteCounter/VoteCounter.variables";
import { percent } from "csx";

export const voteCounterClasses = useThemeCache(() => {
    const globalVars = globalVariables();
    const vars = voteCounterVariables();

    const root = css({
        backgroundColor: vars.colors.bg,
        color: ColorsUtils.colorOut(vars.colors.fg),
        fontSize: vars.sizing.height,
        lineHeight: 1,
        width: "1em",
        borderRadius: "1em",
        minHeight: "1em",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        boxShadow: `0px 0px 0px 2px ${ColorsUtils.colorOut(globalVars.mainColors.bg)}`,
    });

    const count = css({
        fontSize: "0.35em",
        fontWeight: globalVars.fonts.weights.semiBold,

        [`&:first-child`]: {
            // the count is first child when there is only an 'up' vote arrow.
            lineHeight: 1.43,
            marginBottom: percent(-20),
        },
        [`&:nth-child(2)`]: {
            // the count is second child when there there are 'up' and 'down' vote arrows.
            lineHeight: 0.72,
        },
    });

    const iconCheckedStyle: CSSObject = {
        stroke: "currentcolor",
        fillOpacity: 1,
    };

    const iconDefaultStyle: CSSObject = {
        fill: "currentcolor",
        fillOpacity: 0,
        stroke: "currentcolor",
    };

    const icon = css({
        ...iconDefaultStyle,
        transition: "all .1s linear",
        width: "0.625em",
        height: "0.625em",
    });

    const iconChecked = css(iconCheckedStyle);

    return {
        root,
        count,
        icon,
        iconChecked,
    };
});
