<form class="form-horizontal" action="{{ route('payment_method.update') }}" method="POST">
    @csrf
    <input type="hidden" name="payment_method" value="phonepe">

    <div class="form-group row">
        <input type="hidden" name="types[]" value="phonepe_environment">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Environment') }}</label>
        </div>
        <div class="col-md-8">
            <select class="form-control aiz-selectpicker" name="phonepe_environment">
                <option value="sandbox" @selected(get_setting('phonepe_environment', 'sandbox') === 'sandbox')>{{ translate('Sandbox') }}</option>
                <option value="production" @selected(get_setting('phonepe_environment') === 'production')>{{ translate('Production') }}</option>
            </select>
        </div>
    </div>

    <div class="form-group row">
        <input type="hidden" name="types[]" value="phonepe_client_id">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Client ID') }}</label>
        </div>
        <div class="col-md-8">
            <input type="text" class="form-control" name="phonepe_client_id" value="{{ get_setting('phonepe_client_id') ?: get_setting('PHONEPE_CLIENT_ID') }}" required>
        </div>
    </div>

    <div class="form-group row">
        <input type="hidden" name="types[]" value="phonepe_client_version">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Client Version') }}</label>
        </div>
        <div class="col-md-8">
            <input type="text" class="form-control" name="phonepe_client_version" value="{{ get_setting('phonepe_client_version') ?: get_setting('PHONEPE_CLIENT_VERSION', '1') }}" required>
        </div>
    </div>

    <div class="form-group row">
        <input type="hidden" name="types[]" value="phonepe_client_secret">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Client Secret') }}</label>
        </div>
        <div class="col-md-8">
            <input type="password" class="form-control" name="phonepe_client_secret" value="{{ get_setting('phonepe_client_secret') ?: get_setting('PHONEPE_CLIENT_SECRET') }}" required>
        </div>
    </div>

    <div class="form-group row">
        <input type="hidden" name="types[]" value="phonepe_base_url">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Base URL') }}</label>
        </div>
        <div class="col-md-8">
            <input type="url" class="form-control" name="phonepe_base_url" value="{{ get_setting('phonepe_base_url') ?: get_setting('PHONEPE_BASE_URL') }}" placeholder="https://api-preprod.phonepe.com/apis/pg-sandbox">
        </div>
    </div>

    <div class="form-group row">
        <input type="hidden" name="types[]" value="phonepe_timeout_seconds">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Timeout Seconds') }}</label>
        </div>
        <div class="col-md-8">
            <input type="number" min="5" class="form-control" name="phonepe_timeout_seconds" value="{{ get_setting('phonepe_timeout_seconds', '20') }}">
        </div>
    </div>

    <div class="form-group mb-0 text-right">
        <button type="submit" class="btn btn-sm btn-primary">{{ translate('Save') }}</button>
    </div>
</form>
