<!doctype html>
@if (\App\Models\Language::where('code', Session::get('locale', Config::get('app.locale')))->first()->rtl == 1)
    <html dir="rtl" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
@else
    <html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
@endif

<head>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="app-url" content="{{ getBaseURL() }}">
    <meta name="file-base-url" content="{{ getFileBaseURL() }}">

    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Favicon -->
    <link rel="icon" href="{{ uploaded_asset(get_setting('site_icon')) }}">
    <link rel="apple-touch-icon" href="{{ uploaded_asset(get_setting('site_icon')) }}">
    <title>{{ get_setting('website_name') . ' | ' . get_setting('site_motto') }}</title>

    <!-- google font -->
    {{-- <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700"> --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap">

    <!-- aiz core css -->
    <link rel="stylesheet" href="{{ static_asset('assets/css/vendors.css') }}">
    @if (\App\Models\Language::where('code', Session::get('locale', Config::get('app.locale')))->first()->rtl == 1)
        <link rel="stylesheet" href="{{ static_asset('assets/css/bootstrap-rtl.min.css') }}">
    @endif
    <link rel="stylesheet" href="{{ static_asset('assets/css/aiz-core.css?v=') }}{{ rand(1000,9999) }}">
    <link rel="stylesheet" href="{{ static_asset('assets/css/custom-style.css?v=') }}{{ rand(1000,9999) }}">

    <style>
        :root {
            --blue: #3390f3;
            --hov-blue: #1f6dc2;
            --soft-blue: #f1fafd;

            --primary: #009ef7;
            --hov-primary: #008cdd;
            --soft-primary: #f1fafd;
            --secondary: #a1a5b3;
            --soft-secondary: rgba(143, 151, 171, 0.15);
            --success: #19c553;
            --hov-success: #16a846;
            --soft-success:  #e6fff3;
            --info: #8f60ee;
            --hov-info: #714cbd;
            --soft-info: #f4effe;
            --warning: #ffc700;
            --soft-warning: #fff9e3;
            --danger: #F0416C;
            --soft-danger: #fff4f8;
            --dark: #232734;
            --soft-dark: #1b2133;

            --secondary-base: #f1416c;
            --hov-secondary-base: #c73459;
            --soft-secondary-base: rgb(241, 65, 108, 0.15);
        }
        body {
            font-size: 12px;
            font-family: {!! !empty(get_setting('system_font_family')) ? get_setting('system_font_family') : "'Inter', sans-serif" !!}, sans-serif;
        }
        /* .bootstrap-select .btn,
        .btn:not(.btn-circle),
        .form-control,
        .input-group-text,
        .custom-file-label, .custom-file-label::after {
            border-radius: 0;
        } */
        .border-gray {
            border-color: #e4e5eb !important;
        }
        .card {
            border-radius: 8px;
            background: #fff;
            border: 1px solid #f1f1f4;
            box-shadow: 0px 6px 14px rgba(35, 39, 52, 0.04);
        }
        .form-control {
            border: 1px solid #e4e5eb;
        }
        .aiz-color-input{
            border-top-left-radius: 4px !important;
            border-bottom-left-radius: 4px !important;
        }
        .form-control.file-amount{
            border-top-right-radius: 4px !important;
            border-bottom-right-radius: 4px !important;
        }
    </style>
    
    <!-- Admin Utilities CSS -->
    <link rel="stylesheet" href="{{ static_asset('assets/css/admin-utilities.css?v=') }}{{ rand(1000,9999) }}">

    <!-- Ultra Modern Admin Redesign CSS -->
    <link rel="stylesheet" href="{{ static_asset('assets/css/admin-redesign.css?v=') }}{{ rand(1000,9999) }}">

    <script>
        var AIZ = AIZ || {};
        AIZ.local = {
            nothing_selected: '{!! translate('Nothing selected', null, true) !!}',
            nothing_found: '{!! translate('Nothing found', null, true) !!}',
            choose_file: '{{ translate('Choose file') }}',
            file_selected: '{{ translate('File selected') }}',
            files_selected: '{{ translate('Files selected') }}',
            add_more_files: '{{ translate('Add more files') }}',
            adding_more_files: '{{ translate('Adding more files') }}',
            drop_files_here_paste_or: '{{ translate('Drop files here, paste or') }}',
            browse: '{{ translate('Browse') }}',
            upload_complete: '{{ translate('Upload complete') }}',
            upload_paused: '{{ translate('Upload paused') }}',
            resume_upload: '{{ translate('Resume upload') }}',
            pause_upload: '{{ translate('Pause upload') }}',
            retry_upload: '{{ translate('Retry upload') }}',
            cancel_upload: '{{ translate('Cancel upload') }}',
            uploading: '{{ translate('Uploading') }}',
            processing: '{{ translate('Processing') }}',
            complete: '{{ translate('Complete') }}',
            file: '{{ translate('File') }}',
            files: '{{ translate('Files') }}',
            saving: '{{ translate('Saving') }}',
            something_went_wrong: '{{translate('Something went wrong!')}}',
            error_occured_while_processing: '{{translate('An error occurred while processing')}}',
            saving_as_draft: '{{translate('Saving As Draft')}}',
        }
    </script>

</head>

<body class="">

    <div class="aiz-main-wrapper">
        @include('backend.inc.admin_sidenav')
        <div class="aiz-content-wrapper bg-white">
            @include('backend.inc.admin_nav')
            <div class="aiz-main-content">
                <div class="px-15px px-lg-25px">
                    @hasSection('breadcrumb')
                        <div class="py-2">
                            @yield('breadcrumb')
                        </div>
                    @endif
                    @yield('content')
                </div>
                <div class="bg-white text-center py-3 px-15px px-lg-25px mt-auto border-top">
                    <p class="mb-0">&copy; {{ get_setting('site_name') }} v{{ get_setting('current_version') }}</p>
                </div>
            </div><!-- .aiz-main-content -->
        </div><!-- .aiz-content-wrapper -->
    </div><!-- .aiz-main-wrapper -->

    
    <!-- Bulk Action modal -->
    @include('modals.bulk_action_modal')
    @yield('modal')


    <script src="{{ static_asset('assets/js/vendors.js') }}"></script>
    <script src="{{ static_asset('assets/js/aiz-core.js?v=') }}{{ rand(1000,9999) }}"></script>
    <script src="{{ static_asset('assets/js/aiz-form-submission.js?v=') }}{{ rand(1000,9999) }}"></script>

    <script type="text/javascript">
        (function($) {
            if (!window.AIZ || !AIZ.uploader) {
                return;
            }

            var invalidMediaRefs = [
                '',
                'undefined',
                'null',
                'nan',
                'not defined',
                '[object object]',
                'uploads',
                'uploads/all',
                'public/uploads/all',
                'core/public/uploads/all'
            ];

            function normalizeMediaRef(value) {
                return value
                    .toString()
                    .trim()
                    .replace(/\\/g, '/')
                    .replace(/^https?:\/\/[^/]+/i, '')
                    .replace(/^\/+|\/+$/g, '')
                    .toLowerCase();
            }

            function parseSelectedFiles(value) {
                if (!value) {
                    return [];
                }

                var seen = {};
                return value
                    .toString()
                    .split(',')
                    .map(function(item) {
                        return item.trim();
                    })
                    .filter(function(item) {
                        var normalized = normalizeMediaRef(item);
                        if (normalized.indexOf('public/') === 0) {
                            normalized = normalized.substring(7);
                        }

                        if (
                            invalidMediaRefs.indexOf(normalized) !== -1 ||
                            item.slice(-1) === '/' ||
                            seen[item]
                        ) {
                            return false;
                        }

                        seen[item] = true;
                        return /^\d+$/.test(item) || /\.[a-z0-9]{2,5}($|\?)/i.test(item);
                    });
            }

            function isMultipleUploader($uploader) {
                var multiple = $uploader.data('multiple');
                return multiple === true || multiple === 'true' || multiple === 1 || multiple === '1';
            }

            function sanitizeUploader($uploader) {
                var $input = $uploader.find('.selected-files');
                var selected = parseSelectedFiles($input.val());

                if (!isMultipleUploader($uploader)) {
                    selected = selected.slice(0, 1);
                }

                $input.val(selected.join(','));

                if (selected.length === 0) {
                    $uploader.find('.file-amount').html(AIZ.local.choose_file);
                    $uploader.next('.file-preview').html(null);
                }

                return selected;
            }

            function normalizePreviewFile(file) {
                if (!file || !file.file_name) {
                    return null;
                }

                var fileName = file.file_name.toString();
                var basename = fileName.split('?')[0].split('/').pop() || '';
                var extension = (file.extension || basename.split('.').pop() || '').toString();
                var originalName = (file.file_original_name || basename.replace(new RegExp('\\.' + extension + '$', 'i'), '') || basename).toString();

                if (!originalName || normalizeMediaRef(originalName) === 'undefined') {
                    return null;
                }

                file.file_original_name = originalName;
                file.extension = extension;
                file.file_size = Number(file.file_size) || 0;

                if (!file.type && /^(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(extension)) {
                    file.type = 'image';
                }

                return file;
            }

            function renderPreview($uploader, files) {
                var $preview = $uploader.next('.file-preview');
                $preview.html(null);

                if (files.length === 0) {
                    $uploader.find('.file-amount').html(AIZ.local.choose_file);
                    return;
                }

                $uploader.find('.file-amount').html(AIZ.uploader.updateFileHtml(files));

                files.forEach(function(file) {
                    var thumb = '<i class="la la-file-text"></i>';
                    if (file.type === 'image') {
                        thumb = '<img src="' + file.file_name + '" class="img-fit" onerror="this.onerror=null;this.closest(\'.file-preview-item\').remove();">';
                    } else if (file.type === 'video') {
                        thumb = '<video width="320" height="240" controls><source src="' + file.file_name + '" type="video/mp4"></video>';
                    }

                    $preview.append(
                        '<div class="d-flex justify-content-between align-items-center mt-2 file-preview-item" data-id="' + file.id + '" title="' + file.file_original_name + '.' + file.extension + '">' +
                            '<div class="align-items-center align-self-stretch d-flex justify-content-center thumb">' + thumb + '</div>' +
                            '<div class="col body">' +
                                '<h6 class="d-flex"><span class="text-truncate title">' + file.file_original_name + '</span><span class="ext flex-shrink-0">.' + file.extension + '</span></h6>' +
                                '<p>' + AIZ.extra.bytesToSize(file.file_size) + '</p>' +
                            '</div>' +
                            '<div class="remove"><button class="btn btn-sm btn-link remove-attachment" type="button"><i class="la la-close"></i></button></div>' +
                        '</div>'
                    );
                });
            }

            AIZ.uploader.parseSelectedFileReferences = parseSelectedFiles;
            AIZ.extra.bytesToSize = function(bytes) {
                bytes = Number(bytes) || 0;
                if (bytes <= 0) {
                    return '0 Byte';
                }
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            };
            AIZ.uploader.previewGenerate = function() {
                $('[data-toggle="aizuploader"]').each(function() {
                    var $uploader = $(this);
                    var selected = sanitizeUploader($uploader);
                    if (selected.length === 0) {
                        return;
                    }

                    $.post(AIZ.data.appUrl + '/aiz-uploader/get_file_by_ids', {
                        _token: AIZ.data.csrf,
                        ids: selected.join(',')
                    }, function(data) {
                        var files = (Array.isArray(data) ? data : [])
                            .map(normalizePreviewFile)
                            .filter(Boolean);

                        if (!isMultipleUploader($uploader)) {
                            files = files.slice(0, 1);
                        }

                        $uploader.find('.selected-files').val(files.map(function(file) { return file.id; }).join(','));
                        renderPreview($uploader, files);
                    });
                });
            };

            $(function() {
                AIZ.uploader.previewGenerate();
                setTimeout(AIZ.uploader.previewGenerate, 500);
                setTimeout(AIZ.uploader.previewGenerate, 1500);
            });
        })(jQuery);
    </script>

    @yield('script')

    <script type="text/javascript">
        @foreach (session('flash_notification', collect())->toArray() as $message)
            AIZ.plugins.notify('{{ $message['level'] }}', '{{ $message['message'] }}');
        @endforeach

        {{-- FEEDBACK-01: Use flash_type key instead of matching translated strings --}}
        @if (session('flash_type') === 'product_created')
            (function() {
                var data_type = ['digital', 'physical', 'auction', 'wholesale'];
                data_type.forEach(function(element) {
                    localStorage.setItem('tempdataproduct_'+element, '{}');
                    localStorage.setItem('tempload_'+element, 'no');
                });
            })();
        @endif

        $('.dropdown-menu a[data-toggle="tab"]').click(function(e) {
            e.stopPropagation()
            $(this).tab('show')
        })

        if ($('#lang-change').length > 0) {
            $('#lang-change .dropdown-menu a').each(function() {
                $(this).on('click', function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    var locale = $this.data('flag');
                    $.post('{{ route('language.change') }}', {
                        _token: '{{ csrf_token() }}',
                        locale: locale
                    }, function(data) {
                        location.reload();
                    });

                });
            });
        }

        function menuSearch() {
            var filter, item;
            filter = $("#menu-search").val().toUpperCase();
            items = $("#main-menu").find("a");
            items = items.filter(function(i, item) {
                var label = $(item).find(".aiz-side-nav-text")[0].innerText;
                var aliases = $(item).data('search-alias') || '';
                var searchableText = (label + ' ' + aliases).toUpperCase();
                if (searchableText.indexOf(filter) > -1 && $(item)
                    .attr('href') !== '#') {
                    return item;
                }
            });

            if (filter !== '') {
                $("#main-menu").addClass('d-none');
                $("#search-menu").html('')
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        const text = $(items[i]).data('search-result') || $(items[i]).find(".aiz-side-nav-text")[0].innerText;
                        const link = $(items[i]).attr('href');
                        $("#search-menu").append(
                            `<li class="aiz-side-nav-item"><a href="${link}" class="aiz-side-nav-link"><i class="las la-ellipsis-h aiz-side-nav-icon"></i><span>${text}</span></a></li`
                            );
                    }
                } else {
                    $("#search-menu").html(
                        `<li class="aiz-side-nav-item"><span	class="text-center text-muted d-block">{{ translate('Nothing Found') }}</span></li>`
                        );
                }
            } else {
                $("#main-menu").removeClass('d-none');
                $("#search-menu").html('')
            }
        }

        /* ─── FEEDBACK-02: Double-submit protection ─── */
        $(document).on('submit', 'form', function(e) {
            var $form = $(this);
            var $btn = $form.find('[type="submit"]:not(.no-disable)');
            if ($btn.length && !$btn.hasClass('btn-saving')) {
                $btn.addClass('btn-saving');
                $btn.data('original-text', $btn.html());
                $btn.html('<i class="las la-spinner la-spin mr-1"></i> ' + AIZ.local.saving);
                // Re-enable after 10s in case of redirect failure
                setTimeout(function() {
                    $btn.removeClass('btn-saving').html($btn.data('original-text'));
                }, 10000);
            }
        });

        /* ─── WORKFLOW-01 / ACCESS-02: Delivery status change confirmation ─── */
        window.confirmDeliveryStatusChange = function(selectEl, orderId) {
            var newStatus = $(selectEl).val();
            var destructiveStatuses = ['cancelled'];
            if (destructiveStatuses.indexOf(newStatus) !== -1) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: '{{ translate("Confirm Status Change") }}',
                        html: '{{ translate("Are you sure you want to change the status to") }} <strong>' + newStatus.replace('_', ' ') + '</strong>?' +
                              '<br><br><textarea id="status-change-reason" class="form-control mt-2" placeholder="{{ translate("Reason (required)") }}" rows="2"></textarea>',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#F0416C',
                        confirmButtonText: '{{ translate("Yes, change it") }}',
                        cancelButtonText: '{{ translate("Cancel") }}',
                        preConfirm: function() {
                            var reason = document.getElementById('status-change-reason').value;
                            if (!reason.trim()) {
                                Swal.showValidationMessage('{{ translate("Please provide a reason") }}');
                                return false;
                            }
                            return reason;
                        }
                    }).then(function(result) {
                        if (result.isConfirmed) {
                            updateDeliveryStatus(orderId, newStatus, result.value);
                        } else {
                            // Revert select to previous value
                            $(selectEl).val($(selectEl).data('prev-value'));
                            $(selectEl).selectpicker && $(selectEl).selectpicker('refresh');
                        }
                    });
                } else {
                    if (!confirm('{{ translate("Are you sure you want to cancel this order? This action cannot be undone.") }}')) {
                        $(selectEl).val($(selectEl).data('prev-value'));
                        return;
                    }
                    updateDeliveryStatus(orderId, newStatus, '');
                }
            } else {
                // Non-destructive: show inline confirm
                if (confirm('{{ translate("Change delivery status to") }} ' + newStatus.replace('_', ' ') + '?')) {
                    updateDeliveryStatus(orderId, newStatus, '');
                } else {
                    $(selectEl).val($(selectEl).data('prev-value'));
                    $(selectEl).selectpicker && $(selectEl).selectpicker('refresh');
                }
            }
        };

        /* ─── TABLE-01: Sort by dropdown handler ─── */
        window.applySortBy = function(selectEl) {
            var val = $(selectEl).val();
            if (val) {
                var parts = val.split('_');
                var dir = parts.pop();
                var col = parts.join('_');
                var $form = $(selectEl).closest('form');
                // Add or update hidden inputs
                if (!$form.find('input[name="sort_col"]').length) {
                    $form.append('<input type="hidden" name="sort_col" value="">');
                    $form.append('<input type="hidden" name="sort_dir" value="">');
                }
                $form.find('input[name="sort_col"]').val(col);
                $form.find('input[name="sort_dir"]').val(dir);
                $form.submit();
            }
        };

    </script>
</body>

</html>
