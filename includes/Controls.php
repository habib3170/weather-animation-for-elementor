<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class WAFE_Controls {

    public function __construct() {
        add_action('elementor/element/section/section_layout/after_section_end', [$this, 'register']);
        add_action('elementor/element/container/section_layout_container/after_section_end', [$this, 'register']);
    }

    public function register($element) {

        $element->start_controls_section(
            'wafe_section',
            [
                'label' => __('Weather Animation', 'weather-animation-for-elementor'),
                'tab'   => \Elementor\Controls_Manager::TAB_LAYOUT,
            ]
        );

        $element->add_control(
            'wafe_enable',
            [
                'label' => __('Enable Animation', 'weather-animation-for-elementor'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'return_value' => 'yes',
            ]
        );

        $element->add_control(
            'wafe_bg_color',
            [
                'label'     => __( 'Background Color', 'weather-animation-for-elementor' ),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#0B1F3F',
                'condition' => ['wafe_enable' => 'yes']
            ]
        );

        $element->add_control(
            'wafe_type',
            [
                'label' => __('Weather Type', 'weather-animation-for-elementor'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'rain' => 'Rain',
                    'snow' => 'Snow',
                    'cloud' => 'Clouds',
                    'sunny' => 'Sunny',
                ],
                'default' => 'rain',
                'condition' => ['wafe_enable' => 'yes']
            ]
        );

        $element->add_control(
            'wafe_density',
            [
                'label' => __('Density', 'weather-animation-for-elementor'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 80,
                'min' => 10,
                'max' => 300,
                'condition' => ['wafe_enable' => 'yes']
            ]
        );

        $element->add_control(
            'wafe_speed',
            [
                'label' => __('Speed', 'weather-animation-for-elementor'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 2,
                'min' => 1,
                'max' => 10,
                'condition' => ['wafe_enable' => 'yes']
            ]
        );

        $element->add_control(
            'wafe_mouse_effect',
            [
                'label' => __('Mouse Hover Effect', 'weather-animation-for-elementor'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'return_value' => 'yes',
                'condition' => ['wafe_enable' => 'yes']
            ]
        );

        $element->add_control(
            'wafe_mouse_effect_type',
            [
                'label' => __('Mouse Effect Type', 'weather-animation-for-elementor'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'repel' => __('Move Away', 'weather-animation-for-elementor'),
                    'attract' => __('Come Near', 'weather-animation-for-elementor'),
                ],
                'default' => 'repel',
                'condition' => [
                    'wafe_enable' => 'yes',
                    'wafe_mouse_effect' => 'yes'
                ]
            ]
        );

        $element->end_controls_section();
    }
}
