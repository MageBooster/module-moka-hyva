<?php
/*
 * Copyright (c) 2026 WebWorks 101 OÜ (MageBooster). All rights reserved.
 * Commercial licence, see LICENSE.txt. https://magebooster.com
 * Licensed per serial number for one production installation (one store domain); staging and
 * development copies of that store are allowed. Serial numbers and downloads are tied to the customer.
 * You may modify this code for your own licensed store; keep this notice.
 * Not allowed: copying to other stores, redistributing, reselling, sublicensing, publishing it publicly,
 * removing licence checks or notices, sharing serial numbers. Unauthorised use: the serial number is
 * revoked without refund, updates and support stop, damages and legal action may follow.
 * Estonian law applies; court: Harju County Court (Harju Maakohus).
 */
declare(strict_types=1);

namespace MageBooster\MokaHyva\ViewModel;

use MageBooster\Moka\Model\ConfigProvider;
use MageBooster\Moka\Model\Settings;
use Magento\Framework\View\Element\Block\ArgumentInterface;

/**
 * Checkout data of MageBooster_Moka (the same values the Luma renderer gets from window.checkoutConfig) for the
 * MageBooster Checkout panel.
 */
class Panel implements ArgumentInterface
{
    public const CODE = Settings::CODE;

    /** @var array<string, mixed>|null */
    private ?array $config = null;

    public function __construct(
        private ConfigProvider $configProvider
    ) {
    }

    /** @return array<string, mixed> */
    public function config(): array
    {
        if ($this->config === null) {
            $data = $this->configProvider->getConfig();
            $this->config = (array)($data['payment'][self::CODE] ?? []);
        }
        return $this->config;
    }

    public function isAvailable(): bool
    {
        return $this->config() !== [];
    }

    public function description(): string
    {
        return (string)($this->config()['description'] ?? '');
    }

    public function isTestMode(): bool
    {
        return !empty($this->config()['testMode']);
    }

    /** TRY rate when the order is converted to Turkish lira, else null. */
    public function tryRate(): ?float
    {
        $config = $this->config();
        return !empty($config['convertToTry']) && !empty($config['tryRate']) ? (float)$config['tryRate'] : null;
    }

    public function baseCurrency(): string
    {
        return (string)($this->config()['baseCurrency'] ?? '');
    }

    /** Card fields under the method (setting "Card details entered" = inline). */
    public function isInline(): bool
    {
        return !empty($this->config()['inline']);
    }

    /** Data for the checkout script (read from a JSON tag, no inline script). */
    public function scriptJson(): string
    {
        $config = $this->config();
        return (string)json_encode([
            'code' => self::CODE,
            'inline' => !empty($config['inline']),
            'startUrl' => (string)($config['startUrl'] ?? ''),
            't' => [
                'card' => (string)__('Please check the card details.'),
                'failed' => (string)__('The payment could not be started. Please try again.'),
            ],
        ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
    }
}
