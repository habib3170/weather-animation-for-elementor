<?php

if ( ! defined( 'ABSPATH' ) ) exit;

class WAFE_Assets {

    public function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'register_assets' ] );
    }

    public function register_assets() {

        wp_register_script(
            'wafe-sunny',
            WAFE_URL . 'assets/js/animations/sunny.js',
            [],
            '1.0',
            true
        );

        wp_register_script(
            'wafe-rain',
            WAFE_URL . 'assets/js/animations/rain.js',
            [],
            '1.0',
            true
        );

        wp_register_script(
            'wafe-snow',
            WAFE_URL . 'assets/js/animations/snow.js',
            [],
            '1.0',
            true
        );

        wp_register_script(
            'wafe-cloud',
            WAFE_URL . 'assets/js/animations/cloud.js',
            [],
            '1.0',
            true
        );

        wp_register_script(
            'wafe-weather',
            WAFE_URL . 'assets/js/weather.js',
            [ 'jquery' ],
            '1.0',
            true
        );

        wp_register_style(
            'wafe-weather',
            WAFE_URL . 'assets/css/weather.css',
            [],
            '1.0'
        );
    }
}