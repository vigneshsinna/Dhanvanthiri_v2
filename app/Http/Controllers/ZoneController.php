<?php

namespace App\Http\Controllers;

use App\Http\Requests\ZoneRequest;
use App\Models\Country;
use App\Models\Zone;


class ZoneController extends Controller
{
    public function __construct()
    {
        // Staff Permission Check
        $this->middleware(['permission:manage_zones'])->only('index', 'create', 'edit', 'destroy');
    }

    public function index()
    {
        $zones = Zone::latest()->paginate(10);
        return view('backend.setup_configurations.zones.index', compact('zones'));
    }


    public function create()
    {
        $countries = Country::where('status', 1)->get();
        $states = \App\Models\State::where('status', 1)->get();
        return view('backend.setup_configurations.zones.create', compact('countries', 'states'));
    }


    public function store(ZoneRequest $request)
    {
        $zone = Zone::create($request->only(['name', 'status']));

        if ($request->country_id) {
            foreach ($request->country_id as $val) {
                Country::where('id', $val)->update(['zone_id' => $zone->id]);
            }
        }

        if ($request->state_id) {
            foreach ($request->state_id as $val) {
                \App\Models\State::where('id', $val)->update(['zone_id' => $zone->id]);
            }
        }

        flash(translate('Zone has been created successfully'))->success();
        return redirect()->route('zones.index');
    }

    public function edit(Zone $zone)
    {
        $countries = Country::where('status', 1)->get();
        
        $states = \App\Models\State::where('status', 1)->get();

        return view('backend.setup_configurations.zones.edit', compact('countries', 'zone', 'states'));
    }


    public function update(ZoneRequest $request, Zone $zone)
    {
        $zone->update($request->only(['name']));

        Country::where('zone_id', $zone->id)->update(['zone_id' => 0]);
        if ($request->country_id) {
            foreach ($request->country_id as $val) {
                Country::where('id', $val)->update(['zone_id' => $zone->id]);
            }
        }

        \App\Models\State::where('zone_id', $zone->id)->update(['zone_id' => 0]);
        if ($request->state_id) {
            foreach ($request->state_id as $val) {
                \App\Models\State::where('id', $val)->update(['zone_id' => $zone->id]);
            }
        }

        flash(translate('Zone has been updated successfully'))->success();
        return back();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $zone = Zone::findOrFail($id);

        Country::where('zone_id', $zone->id)->update(['zone_id' => 0]);
        \App\Models\State::where('zone_id', $zone->id)->update(['zone_id' => 0]);

        Zone::destroy($id);

        flash(translate('Zone has been deleted successfully'))->success();
        return redirect()->route('zones.index');
    }
}
