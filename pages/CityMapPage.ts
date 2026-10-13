import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CityMapPage extends BasePage {
  readonly mapContainer: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly fullScreenButton: Locator;
  readonly policeBoundaryButton: Locator;
  readonly keyLocationsButton: Locator;
  readonly cmrlButton: Locator;
  readonly layersButton: Locator;

  constructor(page: Page) {
    super(page);

    this.mapContainer = page.locator('#touristLocations_map_id');
    this.zoomInButton = page.locator('button.ol-zoom-in');
    this.zoomOutButton = page.locator('button.ol-zoom-out');
    this.fullScreenButton = page.locator('button.ol-full-screen-false, button.ol-full-screen-true');
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
    return await this.page.evaluate(() => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return -1;
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return -1;
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof state.memoizedState.getView === 'function' && typeof state.memoizedState.getLayers === 'function') {
            return state.memoizedState.getView().getZoom();
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return -1;
    });
  }

  async getLayerVisibility(layerTitle: string): Promise<boolean | null> {
    return await this.page.evaluate((title) => {
      const mapDiv = document.getElementById('touristLocations_map_id');
      if (!mapDiv) return null;
      const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return null;
      let current = (mapDiv as any)[fiberKey];
      let depth = 0;
      while (current && depth < 30) {
        let state = current.memoizedState;
        let stateDepth = 0;
        while (state && stateDepth < 15) {
          if (state.memoizedState && typeof state.memoizedState.getLayers === 'function') {
            const map = state.memoizedState;
            const layers = map.getLayers().getArray();
            const targetLayer = layers.find((l: any) => l.get('title') === title);
            if (targetLayer) {
              return targetLayer.getVisible();
            }
          }
          state = state.next;
          stateDepth++;
        }
        current = current.return;
        depth++;
      }
      return null;
    }, layerTitle);
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
}
