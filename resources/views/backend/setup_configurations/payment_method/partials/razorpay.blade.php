<form class="form-horizontal" action="{{ route('payment_method.update') }}" method="POST">
    @csrf
    <input type="hidden" name="payment_method" value="razorpay">
    <div class="form-group row">
        <input type="hidden" name="types[]" value="RAZOR_KEY">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('RAZOR KEY') }}</label>
        </div>
        <div class="col-md-8">
            <input type="text" class="form-control" name="RAZOR_KEY"
                value="{{ get_setting('RAZOR_KEY') ?: get_setting('razorpay_key_id') }}" placeholder="{{ translate('RAZOR KEY') }}"
                required>
        </div>
    </div>
    <div class="form-group row">
        <input type="hidden" name="types[]" value="RAZOR_SECRET">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('RAZOR SECRET') }}</label>
        </div>
        <div class="col-md-8">
            <input type="text" class="form-control" name="RAZOR_SECRET"
                value="{{ get_setting('RAZOR_SECRET') ?: get_setting('razorpay_key_secret') }}"
                placeholder="{{ translate('RAZOR SECRET') }}" required>
        </div>
    </div>
    <div class="form-group row">
        <div class="col-md-4">
            <label class="col-from-label">{{ translate('Razorpay Test Mode') }}</label>
        </div>
        <div class="col-md-8">
            <label class="aiz-switch aiz-switch-success mb-0">
                <input type="checkbox" onchange="updateSettings(this, 'razorpay_test_mode')" @if(get_setting('razorpay_test_mode') == 1) checked @endif>
                <span class="slider round"></span>
            </label>
        </div>
    </div>
    <div class="form-group mb-0 text-right">
        <button type="submit" class="btn btn-sm btn-primary">{{ translate('Save') }}</button>
    </div>
</form>
