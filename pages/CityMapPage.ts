import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CityMapPage extends BasePage {
  readonly mapContainer: Locator;
  readonly mapCanvas: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly fullScreenButton: Locator;
  readonly policeBoundaryButton: Locator;
  readonly keyLocationsButton: Locator;
  readonly cmrlButton: Locator;
  readonly layersButton: Locator;
  readonly expandFullScreenButton: Locator;
  readonly exitFullScreenButton: Locator;

  constructor(page: Page) {
    super(page);

    this.mapContainer = page.locator('#touristLocations_map_id');
    this.mapCanvas = this.mapContainer.locator('canvas').first();
    this.zoomInButton = page.locator('button.ol-zoom-in');
    this.zoomOutButton = page.locator('button.ol-zoom-out');
    this.fullScreenButton = page.locator('button.ol-full-screen-false, button.ol-full-screen-true');
    this.expandFullScreenButton = page.locator('button.ol-full-screen-false');
    this.exitFullScreenButton = page.locator('button.ol-full-screen-true');
    this.policeBoundaryButton = page.locator('button[aria-label="Traffic Police Boundry"]');
    this.keyLocationsButton = page.locator('button[aria-label="Key Locations"]');
    this.cmrlButton = page.locator('button[aria-label="CMRL"]');
    this.layersButton = page.locator('button:has(svg[data-testid="LayersIcon"])');
  }

  async openCityMap() {
    await this.navigate('https://gctp.in/chennai_map');
    await this.closeAnyPopup();
    await expect(this.mapContainer).toBeVisible({ timeout: 15000 });
  }

  async openCityMapFromHomePage() {
    await this.navigate('https://gctp.in/');
    await this.navigate('https://gctp.in/chennai-home');
    await this.page.getByRole('link', { name: 'City Map' }).click();
    await this.closeAnyPopup();
    await expect(this.mapContainer).toBeVisible({ timeout: 15000 });
    await expect(this.mapCanvas).toBeVisible();
  }

  async clickMapCanvas(position?: { x: number; y: number }) {
    await this.mapCanvas.click(position ? { position } : {});
  }

  async clickZoomIn() {
    await this.zoomInButton.click();
  }

  async clickZoomOut() {
    await this.zoomOutButton.click();
  }

  async toggleFullScreen() {
    await this.fullScreenButton.click();
  }

  async toggleLayerButton(buttonLocator: Locator) {
    await buttonLocator.evaluate((el: HTMLElement) => {
      el.scrollIntoView();
      el.click();
    });
  }

  async togglePoliceBoundary() {
    await this.toggleLayerButton(this.policeBoundaryButton);
  }

  async toggleKeyLocations() {
    await this.toggleLayerButton(this.keyLocationsButton);
  }

  async toggleCmrl() {
    await this.toggleLayerButton(this.cmrlButton);
  }

  async clickLayersButton() {
    await this.layersButton.click();
  }

  async getMapZoom(): Promise<number> {
    const result = await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return { error: 'Map container element (#touristLocations_map_id) not found' };
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'React Fiber key not found on map container element' };
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof state.memoizedState.getView === 'function') {
            const view = state.memoizedState.getView();
            if (view && typeof view.getZoom === 'function') {
              return { zoom: view.getZoom() };
            }
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return { error: 'Map view or zoom not found in React Fiber tree' };
    });

    if (result && 'error' in result) {
      throw new Error(`[React Fiber Introspection Error] ${result.error}`);
    }
    if (!result || typeof result.zoom !== 'number') {
      throw new Error('[React Fiber Introspection Error] Retrieved map zoom is invalid or missing');
    }
    return result.zoom;
  }

  async getMinZoom(): Promise<number> {
    const result = await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return { error: 'Map container element (#touristLocations_map_id) not found' };
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'React Fiber key not found on map container element' };
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof state.memoizedState.getView === 'function') {
            const view = state.memoizedState.getView();
            if (view && typeof view.getMinZoom === 'function') {
              return { minZoom: view.getMinZoom() };
            }
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return { error: 'Map view or minZoom not found in React Fiber tree' };
    });

    if (result && 'error' in result) {
      throw new Error(`[React Fiber Introspection Error] ${result.error}`);
    }
    if (!result || typeof result.minZoom !== 'number') {
      throw new Error('[React Fiber Introspection Error] Retrieved min zoom is invalid or missing');
    }
    return result.minZoom;
  }

  async getMaxZoom(): Promise<number> {
    const result = await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return { error: 'Map container element (#touristLocations_map_id) not found' };
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'React Fiber key not found on map container element' };
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof state.memoizedState.getView === 'function') {
            const view = state.memoizedState.getView();
            if (view && typeof view.getMaxZoom === 'function') {
              return { maxZoom: view.getMaxZoom() };
            }
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return { error: 'Map view or maxZoom not found in React Fiber tree' };
    });

    if (result && 'error' in result) {
      throw new Error(`[React Fiber Introspection Error] ${result.error}`);
    }
    if (!result || typeof result.maxZoom !== 'number') {
      throw new Error('[React Fiber Introspection Error] Retrieved max zoom is invalid or missing');
    }
    return result.maxZoom;
  }

  async getAllLayerInfo(): Promise<{ title: string; visible: boolean }[]> {
    const result = await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return { error: 'Map container element (#touristLocations_map_id) not found' };
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'React Fiber key not found on map container element' };
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof state.memoizedState.getLayers === 'function') {
            const map = state.memoizedState;
            const layers = map.getLayers().getArray();
            return {
              layers: layers.map((l: any) => ({
                title: l.get('title') || 'Untitled',
                visible: l.getVisible()
              }))
            };
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return { error: 'Map layers not found in React Fiber tree' };
    });

    if (result && 'error' in result) {
      throw new Error(`[React Fiber Introspection Error] ${result.error}`);
    }
    if (!result || !result.layers) {
      throw new Error('[React Fiber Introspection Error] Retrieved layers list is missing or invalid');
    }
    return result.layers;
  }

  async getLayerVisibility(layerTitle: string): Promise<boolean> {
    const result = await this.page.evaluate((title) => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return { error: 'Map container element (#touristLocations_map_id) not found' };
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'React Fiber key not found on map container element' };
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof (state.memoizedState as any).getLayers === 'function') {
            const mapObj = state.memoizedState;
            const layers = mapObj.getLayers().getArray();
            const targetLayer = layers.find((l: any) => l.get('title') === title);
            if (targetLayer) {
              return { visible: targetLayer.getVisible() };
            } else {
              const availableTitles = layers.map((l: any) => l.get('title') || 'Untitled').join(', ');
              return { error: `Required layer "${title}" not found in OpenLayers map instance. Available layers: [${availableTitles}]` };
            }
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return { error: 'Map object not found in React Fiber tree while querying layer visibility' };
    }, layerTitle);

    if (result && 'error' in result) {
      throw new Error(`[React Fiber Introspection Error] ${result.error}`);
    }
    if (!result || typeof result.visible !== 'boolean') {
      throw new Error(`[React Fiber Introspection Error] Retrieved visibility for layer "${layerTitle}" is invalid or missing`);
    }
    return result.visible;
  }

  async isFullScreenActive(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement ||
        document.querySelector('button.ol-full-screen-true')
      );
    });
  }

  async getTouristLayerFeatureCounts(): Promise<{ total: number; parkingCount: number; touristCount: number; typeBreakdown: Record<string, number> }> {
    return await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) throw new Error('Map container element not found');
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) throw new Error('React Fiber key not found');
      let current = (mapDiv as any)[fiberKey];
      let mapObj: any = null;
      while (current) {
        let state = current.memoizedState;
        while (state) {
          if (state.memoizedState && typeof state.memoizedState.getLayers === 'function') {
            mapObj = state.memoizedState;
            break;
          }
          state = state.next;
        }
        if (mapObj) break;
        current = current.return;
      }
      if (!mapObj) throw new Error('Map object not found');

      const layer = mapObj.getLayers().getArray().find((l: any) => l.get('title') === 'Tourist_locations');
      if (!layer) throw new Error('Required layer "Tourist_locations" not found');

      const features = layer.getSource()?.getFeatures() || [];
      const typeBreakdown: Record<string, number> = {};
      const validTouristTypes = ['Museum', 'Mosque', 'Mall', 'Beach', 'Temple', 'Church', 'Historical', 'Entertaintment', 'Parking'];

      let parkingCount = 0;
      let touristCount = 0;

      for (const f of features) {
        const pType = f.get('f_place_type');
        if (!pType || !validTouristTypes.includes(pType)) continue;

        typeBreakdown[pType] = (typeBreakdown[pType] || 0) + 1;
        if (pType === 'Parking') {
          parkingCount++;
        } else {
          touristCount++;
        }
      }

      return { total: features.length, parkingCount, touristCount, typeBreakdown };
    });
  }

  async validateTouristLayerCoordinates(): Promise<boolean> {
    const invalidFeatures = await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) throw new Error('Map container element not found');
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) throw new Error('React Fiber key not found');
      let current = (mapDiv as any)[fiberKey];
      let mapObj: any = null;
      while (current) {
        let state = current.memoizedState;
        while (state) {
          if (state.memoizedState && typeof state.memoizedState.getLayers === 'function') {
            mapObj = state.memoizedState;
            break;
          }
          state = state.next;
        }
        if (mapObj) break;
        current = current.return;
      }
      if (!mapObj) throw new Error('Map object not found');

      const layer = mapObj.getLayers().getArray().find((l: any) => l.get('title') === 'Tourist_locations');
      if (!layer) throw new Error('Required layer "Tourist_locations" not found');
      const features = layer.getSource()?.getFeatures() || [];

      const invalid: string[] = [];
      const view = mapObj.getView();
      const proj = view.getProjection().getCode();

      for (const f of features) {
        const geom = f.getGeometry();
        let coords = geom.getCoordinates();

        if (proj === 'EPSG:3857') {
           // Basic Web Mercator to WGS84
           const x = (coords[0] * 180) / 20037508.34;
           const y = (Math.atan(Math.exp((coords[1] * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
           coords = [x, y];
        }

        if (coords[0] < 79 || coords[0] > 81 || coords[1] < 12 || coords[1] > 14) {
          invalid.push(`${f.get('f_place_name')} (${coords.join(', ')})`);
        }
      }
      return invalid;
    });

    if (invalidFeatures.length > 0) {
      throw new Error(`Invalid features found: ${invalidFeatures.join(', ')}`);
    }
    return true;
  }

  async clickMarkerAndVerifyPopup(isParking: boolean): Promise<string> {
    const targetData = await this.page.evaluate((parkingMode) => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      const fiberKey = Object.keys(mapDiv!).find(k => k.startsWith('__reactFiber'));
      let current = (mapDiv as any)[fiberKey!];
      let mapObj: any = null;
      while (current) {
        let state = current.memoizedState;
        while (state) {
          if (state.memoizedState && typeof state.memoizedState.getLayers === 'function') {
            mapObj = state.memoizedState;
            break;
          }
          state = state.next;
        }
        if (mapObj) break;
        current = current.return;
      }
      if (!mapObj) throw new Error('Map object not found');

      const layer = mapObj.getLayers().getArray().find((l: any) => l.get('title') === 'Tourist_locations');
      const features = layer.getSource().getFeatures();
      const mapSize = mapObj.getSize();

      const feature = features.find((f: any) => {
        const matchesType = parkingMode ? f.get('f_place_type') === 'Parking' : f.get('f_place_type') !== 'Parking';
        if (!matchesType) return false;
        const px = mapObj.getPixelFromCoordinate(f.getGeometry().getCoordinates());
        return px && px[0] > 20 && px[0] < mapSize[0] - 20 && px[1] > 20 && px[1] < mapSize[1] - 20;
      });
      if (!feature) throw new Error('No matching marker inside the viewport');

      const px = mapObj.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
      return { px, placeName: feature.get('f_place_name') };
    }, isParking);

    const px = targetData.px;
    await this.mapCanvas.click({ position: { x: px[0], y: px[1] } });

    await this.page.waitForTimeout(500);
    const popupLocator = this.page.locator('.MuiPopover-paper, [role="dialog"], .ol-popup');
    await expect(popupLocator.first()).toBeVisible({ timeout: 15000 });

    const popupText = await popupLocator.first().textContent() || '';
    const fullText = popupText;

    const hitVerified = await this.page.evaluate(({ px, expectedName }) => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      const fiberKey = Object.keys(mapDiv!).find(k => k.startsWith('__reactFiber'));
      let current = (mapDiv as any)[fiberKey!];
      let mapObj: any = null;
      while (current) {
        let state = current.memoizedState;
        while (state) {
          if (state.memoizedState && typeof state.memoizedState.forEachFeatureAtPixel === 'function') {
            mapObj = state.memoizedState;
            break;
          }
          state = state.next;
        }
        if (mapObj) break;
        current = current.return;
      }
      if (!mapObj) return false;
      let found = false;
      mapObj.forEachFeatureAtPixel(px, (f: any) => {
        if (f.get('f_place_name') === expectedName) {
          found = true;
        }
      }, { hitTolerance: 5 });
      return found;
    }, { px: targetData.px, expectedName: targetData.placeName });

    expect(hitVerified, `Clicked pixel must hit feature "${targetData.placeName}"`).toBe(true);
    expect(fullText.trim().length).toBeGreaterThan(0);

    await this.page.keyboard.press('Escape');
    return targetData.placeName;
  }
}
