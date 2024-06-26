<?php
/**
 * @author Adam Charron <adam.c@vanillaforums.com>
 * @copyright 2009-2019 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

namespace Vanilla\Formatting\Formats;

use Exception;
use Vanilla\Contracts\Formatting\FormatParsedInterface;
use Vanilla\Formatting\BaseFormat;
use Vanilla\Formatting\Exception\FormattingException;
use Vanilla\Formatting\FormatRegexReplacements;
use Vanilla\Formatting\Html\HtmlDocument;
use Vanilla\Formatting\Html\HtmlEnhancer;
use Vanilla\Formatting\Html\HtmlPlainTextConverter;
use Vanilla\Formatting\Html\HtmlSanitizer;
use Vanilla\Formatting\Html\Processor\AttachmentHtmlProcessor;
use Vanilla\Formatting\Html\Processor\HeadingHtmlProcessor;
use Vanilla\Formatting\Html\Processor\ImageHtmlProcessor;
use Vanilla\Formatting\Html\Processor\UserContentCssProcessor;
use Vanilla\Formatting\ParsableDOMInterface;
use Vanilla\Formatting\ParsedFormat;
use Vanilla\Formatting\TextDOMInterface;
use Vanilla\Formatting\UserMentionInterface;
use Vanilla\Formatting\UserMentionsTrait;
use Vanilla\InjectableInterface;

/**
 * Format definition for HTML based formats.
 *
 * @template-implements FormatParsedInterface<HtmlFormatParsed>
 */
class HtmlFormat extends BaseFormat implements InjectableInterface, ParsableDOMInterface
{
    use UserMentionsTrait;

    const FORMAT_KEY = "html";

    /** @var HtmlSanitizer */
    private $htmlSanitizer;

    /** @var HtmlEnhancer */
    private $htmlEnhancer;

    /** @var bool */
    private $shouldCleanupLineBreaks;

    /** @var HtmlPlainTextConverter */
    private $plainTextConverter;

    /** @var HeadingHtmlProcessor */
    private $headingHtmlProcessor;

    /** @var AttachmentHtmlProcessor */
    private $attachmentHtmlProcessor;

    /** @var ImageHtmlProcessor */
    private $imageHtmlProcessor;

    /** @var bool allowExtendedContent */
    protected $allowExtendedContent;

    /** @var string */
    protected $anonymizeUsername;

    /** @var string */
    protected $anonymizeUrl;

    /**
     * Constructor for dependency injection.
     *
     * @param HtmlSanitizer $htmlSanitizer
     * @param HtmlEnhancer $htmlEnhancer
     * @param HtmlPlainTextConverter $plainTextConverter
     * @param bool $shouldCleanupLineBreaks
     * @param bool $allowExtendedContent
     */
    public function __construct(
        HtmlSanitizer $htmlSanitizer,
        HtmlEnhancer $htmlEnhancer,
        HtmlPlainTextConverter $plainTextConverter,
        bool $shouldCleanupLineBreaks = true,
        bool $allowExtendedContent = false
    ) {
        $this->htmlSanitizer = $htmlSanitizer;
        $this->htmlEnhancer = $htmlEnhancer;
        $this->plainTextConverter = $plainTextConverter;
        $this->shouldCleanupLineBreaks = $shouldCleanupLineBreaks;
        $this->allowExtendedContent = $allowExtendedContent;
        $this->anonymizeUsername = $this->getAnonymizeUserName();
        $this->anonymizeUrl = $this->getAnonymizeUserUrl();
    }

    /**
     * Dependency injection.
     *
     * @param AttachmentHtmlProcessor $attachmentHtmlProcessor
     * @param HeadingHtmlProcessor $headingHtmlProcessor
     * @param ImageHtmlProcessor $imageHtmlProcessor
     * @param UserContentCssProcessor $userContentCssProcessor

     */
    public function setDependencies(
        AttachmentHtmlProcessor $attachmentHtmlProcessor,
        HeadingHtmlProcessor $headingHtmlProcessor,
        ImageHtmlProcessor $imageHtmlProcessor,
        UserContentCssProcessor $userContentCssProcessor
    ) {
        $this->attachmentHtmlProcessor = $attachmentHtmlProcessor;
        $this->headingHtmlProcessor = $headingHtmlProcessor;
        $this->imageHtmlProcessor = $imageHtmlProcessor;
        $this->addHtmlProcessor($headingHtmlProcessor);
        $this->addHtmlProcessor($userContentCssProcessor);
    }

    /**
     * Given either html or parsed html, extract html.
     *
     * @param string|HtmlFormatParsed $parsedOrHtml
     * @return string
     */
    private function ensureRenderedHtml($parsedOrHtml): string
    {
        if ($parsedOrHtml instanceof HtmlFormatParsed) {
            return $parsedOrHtml->getProcessedHtml();
        } else {
            return $this->renderHTML($parsedOrHtml, false);
        }
    }

    /**
     * Given either html or parsed html, extract html.
     *
     * @param string|HtmlFormatParsed $parsedOrHtml
     * @return string
     */
    private function ensureRawHtml($parsedOrHtml): string
    {
        if ($parsedOrHtml instanceof HtmlFormatParsed) {
            return $parsedOrHtml->getRawHtml();
        } else {
            return $parsedOrHtml;
        }
    }

    /**
     * @inheritdoc
     */
    public function renderHtml($content, bool $enhance = true): string
    {
        if ($content instanceof HtmlFormatParsed) {
            // We already did the work.
            return $content->getProcessedHtml();
        }
        $result = $this->htmlSanitizer->filter($content, $this->allowExtendedContent);

        if ($this->shouldCleanupLineBreaks) {
            $result = self::cleanupLineBreaks($result);
        }

        $result = $this->legacySpoilers($result);

        if ($enhance) {
            $result = $this->htmlEnhancer->enhance($result, true, !c("Garden.Format.DisableUrlEmbeds", false));
        }

        $result = $this->applyHtmlProcessors($result);
        return $result;
    }

    /**
     * @inheritdoc
     */
    public function renderPlainText($content): string
    {
        $html = $this->ensureRenderedHtml($content);
        return html_entity_decode($this->plainTextConverter->convert($html));
    }

    /**
     * @inheritdoc
     */
    public function renderQuote($content): string
    {
        $result = $this->htmlSanitizer->filter($content);

        if ($this->shouldCleanupLineBreaks) {
            $result = self::cleanupLineBreaks($result);
        }

        $result = $this->legacySpoilers($result);

        // No Embeds
        $result = $this->htmlEnhancer->enhance($result, true, false);
        $result = $this->applyHtmlProcessors($result);
        return $result;
    }

    /**
     * @inheritdoc
     */
    public function filter($content): string
    {
        try {
            $this->ensureRenderedHtml($content);
        } catch (Exception $e) {
            // Rethrow as a formatting exception with exception chaining.
            throw new FormattingException($e->getMessage(), 500, $e);
        }
        return $content;
    }

    /**
     * @inheritdoc
     */
    public function parse(string $content)
    {
        return new HtmlFormatParsed(static::FORMAT_KEY, $content, $this->renderHTML($content));
    }

    /**
     * @inheritdoc
     */
    public function parseAttachments($content): array
    {
        // The HTML format hasn't actually historically supported attachements inline.
        // Attachments are handled out of the post content by the Advanced Editor plugin.
        return [];
    }

    /**
     * @inheritdoc
     */
    public function parseHeadings($content): array
    {
        $rendered = $this->ensureRenderedHtml($content);
        $document = new HtmlDocument($rendered);
        return $this->headingHtmlProcessor->getHeadings($document);
    }

    /**
     * @inheritdoc
     */
    public function parseImageUrls($content): array
    {
        $html = $this->ensureRenderedHtml($content);
        $document = new HtmlDocument($html);
        return $this->imageHtmlProcessor->getImageURLs($document);
    }

    /**
     * @inheritdoc
     */
    public function parseImages($content): array
    {
        $html = $this->ensureRenderedHtml($content);
        $document = new HtmlDocument($html);
        return $this->imageHtmlProcessor->getImages($document);
    }

    /**
     * @inheritdoc
     */
    public function parseMentions($content, $skipTaggedContent = true): array
    {
        $content = $this->ensureRawHtml($content);

        // Legacy Mention Fetcher.
        // This should get replaced in a future refactoring.
        return getMentions($content, $skipTaggedContent, $skipTaggedContent);
    }

    const BLOCK_WITH_OWN_WHITESPACE =
        "(?:table|dl|ul|ol|pre|blockquote|address|p|h[1-6]|" .
        "section|article|aside|hgroup|header|footer|nav|figure|" .
        "figcaption|details|menu|summary|li|tbody|tr|td|th|" .
        "thead|tbody|tfoot|col|colgroup|caption|dt|dd)";

    /**
     * Removes the break above and below tags that have their own natural margin.
     *
     * @param string $html An HTML string to process.
     *
     * @return string
     * @internal Marked public for internal backwards compatibility only.
     */
    public function cleanupLineBreaks(string $html): string
    {
        $zeroWidthWhitespaceRemoved = preg_replace(
            "/(?!<code[^>]*?>)(\015\012|\012|\015)(?![^<]*?<\/code>)/",
            "<br />",
            $html
        );
        $breakBeforeReplaced = preg_replace(
            "!(?:<br\s*/>){1,2}\s*(<" . self::BLOCK_WITH_OWN_WHITESPACE . "[^>]*>)!",
            "\n$1",
            $zeroWidthWhitespaceRemoved
        );
        $breakAfterReplaced = preg_replace(
            "!(</" . self::BLOCK_WITH_OWN_WHITESPACE . "[^>]*>)\s*(?:<br\s*/>){1,2}!",
            "$1\n",
            $breakBeforeReplaced
        );
        return $breakAfterReplaced;
    }

    /**
     * Spoilers with backwards compatibility.
     *
     * In the Spoilers plugin, we would render BBCode-style spoilers in any format post and allow a title.
     *
     * @param string $html
     * @return string
     */
    protected function legacySpoilers(string $html): string
    {
        if ($this->hasLegacySpoilers($html) !== false) {
            $count = 0;
            do {
                $html = preg_replace(
                    '`\[spoiler(?:=(?:&quot;)?[\d\w_\',.? ]+(?:&quot;)?)?\](.*?)\[\/spoiler\]`usi',
                    '<div class="Spoiler">$1</div>',
                    $html,
                    -1,
                    $count
                );
            } while ($count > 0);
        }
        return $html;
    }

    /**
     * Test whether a bit of HTML has legacy spoilers.
     *
     * @param string $html The HTML to test.
     * @return bool
     */
    private function hasLegacySpoilers(string $html): bool
    {
        // Check for an inline spoiler.
        if (preg_match('`(\[spoiler\])[^\n]+(\[\/spoiler\])`', $html)) {
            return true;
        }

        // Check for a multi-line spoiler.
        if (preg_match('`^\[\/?spoiler\]$`m', $html, $m)) {
            return true;
        }

        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function parseDOM(string $content): TextDOMInterface
    {
        $html = $this->renderHtml($content, false);
        $dom = new HtmlDocument($html);
        return $dom;
    }

    /**
     * @inheritdoc
     */
    public function removeUserPII(string $username, string $body): string
    {
        $regex = new FormatRegexReplacements();
        $regex->addReplacement(...$this->getNonRichAtMentionReplacePattern($username, $this->anonymizeUsername));
        $regex->addReplacement(...$this->getUrlReplacementPattern($username, $this->anonymizeUrl));
        $regex->addReplacement(
            sprintf('~<blockquote\s+class="Quote"\s+rel="%s"\s*>~', preg_quote($username)),
            sprintf('<blockquote class="Quote" rel="%s">', $this->anonymizeUsername)
        );
        return $regex->replace($body);
    }

    /**
     * @inheritdoc
     */
    public function parseAllMentions($body): array
    {
        return $this->getNonRichMentions($body, ['<blockquote\s+class="Quote"\s+rel="(.+?)"\s*>']);
    }
}
