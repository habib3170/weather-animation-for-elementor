<div class="wrap">
<h1>Weather Animation Settings</h1>

<form method="post" action="options.php">
<?php settings_fields('wafe_group'); ?>

<table class="form-table">

<tr>
<th>API Key</th>
<td>
<input type="text" name="wafe_api_key"
value="<?php echo esc_attr(get_option('wafe_api_key')); ?>"
class="regular-text">
</td>
</tr>

<tr>
<th>Default City</th>
<td>
<input type="text" name="wafe_city"
value="<?php echo esc_attr(get_option('wafe_city','Dhaka')); ?>"
class="regular-text">
</td>
</tr>

<tr>
<th>Auto GPS Weather</th>
<td>
<input type="checkbox" name="wafe_auto_mode" value="1"
<?php checked(1,get_option('wafe_auto_mode'),true); ?>>
Enable Auto Location Weather
</td>
</tr>

<tr>
<th>Day / Night Mode</th>
<td>
<input type="checkbox" name="wafe_day_night" value="1"
<?php checked(1,get_option('wafe_day_night'),true); ?>>
Enable Day/Night Background
</td>
</tr>

</table>

<?php submit_button(); ?>
</form>
</div>