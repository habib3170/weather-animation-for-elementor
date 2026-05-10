<?php
/**
 * Plugin Name: Weather Animation for Elementor
 * Description: Add Rain, Snow & Cloud animations to Elementor Sections & Containers.
 * Version: 1.0.0
 * Author: Habib Adnan
 * Text Domain: weather-animation-for-elementor
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WAFE_PATH', plugin_dir_path( __FILE__ ) );
define( 'WAFE_URL', plugin_dir_url( __FILE__ ) );

class WAFE_Plugin {

	public function __construct() {

		// Elementor Init
		add_action( 'elementor/init', [ $this, 'init' ] );

		// Frontend Assets
		add_action( 'wp_enqueue_scripts', [ $this, 'register_assets' ] );

		// Elementor Editor Assets
		add_action( 'elementor/editor/before_enqueue_scripts', [ $this, 'register_assets' ] );

		// Elementor Frontend Preview
		add_action( 'elementor/frontend/after_enqueue_scripts', [ $this, 'register_assets' ] );

		// Translation
		add_action( 'init', [ $this, 'load_textdomain' ] );
	}

	/**
	 * Load Translation
	 */
	public function load_textdomain() {

		load_plugin_textdomain(
			'weather-animation-for-elementor',
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages'
		);
	}

	/**
	 * Elementor Init
	 */
	public function init() {

		require_once WAFE_PATH . 'includes/Controls.php';
		require_once WAFE_PATH . 'includes/Render.php';

		new WAFE_Controls();
		new WAFE_Render();
	}

	/**
	 * Register Assets
	 */
	public function register_assets() {

		// JS
		wp_register_script(
			'wafe-weather',
			WAFE_URL . 'assets/js/weather.js',
			[ 'jquery' ],
			'1.0.0',
			true
		);

		// CSS
		wp_register_style(
			'wafe-weather',
			WAFE_URL . 'assets/css/weather.css',
			[],
			'1.0.0'
		);

		// Enqueue
		wp_enqueue_script( 'wafe-weather' );
		wp_enqueue_style( 'wafe-weather' );

		// JS Data
		wp_localize_script(
			'wafe-weather',
			'wafe_data',
			[
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'plugin_url' => WAFE_URL,
				'is_editor' => \Elementor\Plugin::$instance->editor->is_edit_mode(),
			]
		);
	}
}

new WAFE_Plugin();