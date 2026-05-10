<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class WAFE_Render {

    public function __construct() {

        add_action('elementor/frontend/section/before_render', [$this, 'render']);
        add_action('elementor/frontend/container/before_render', [$this, 'render']);
    }

    public function render($element) {

        $settings = $element->get_settings_for_display();

        if ( empty($settings['wafe_enable']) ) return;


        $element->add_render_attribute('_wrapper', [
            'class' => 'wafe-wrapper',
            'data-wafe' => wp_json_encode([
                'wafe_enable' => $settings['wafe_enable'] ?? '',
                'bg_color' => $settings['wafe_bg_color'] ?? '',
                'type'     => $settings['wafe_type'] ?? 'rain',
                'density'  => $settings['wafe_density'] ?? 50,
                'speed'    => $settings['wafe_speed'] ?? 1,
                'mouse_effect' => $settings['wafe_mouse_effect'] ?? '',
                'mouse_effect_type' => $settings['wafe_mouse_effect_type'] ?? 'repel',
            ])
        ]);
    }
}