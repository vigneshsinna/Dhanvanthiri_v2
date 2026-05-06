@extends('emails.invoice')

@section('confirmation_content')
    @if(!empty($content))
        <div style="padding: 24px 30px 0 30px; font-family: Roboto, Arial, sans-serif; color: #333542;">
            {!! $content !!}
        </div>
    @endif
@endsection
