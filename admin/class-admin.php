<?php
if (!defined('ABSPATH')) exit;

class WAFE_Admin {

    public function __construct() {
        add_action('admin_menu', [$this,'menu']);
        add_action('admin_init', [$this,'settings']);
    }

    public function menu() {
        add_menu_page(
            'Weather Animation',
            'Weather Animation',
            'manage_options',
            'wafe-settings',
            [$this,'page'],
            'dashicons-cloud',
            80
        );
    }

    public function settings() {
        register_setting('wafe_group','wafe_api_key');
        register_setting('wafe_group','wafe_auto_mode');
        register_setting('wafe_group','wafe_day_night');
        register_setting('wafe_group','wafe_city');
    }

    public function page() {
        include WAFE_PATH.'admin/views/settings-page.php';
    }
}