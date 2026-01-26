import { Device } from './Device.model';
import axios from 'axios';
import * as deviceService from './device.service';
import { DeploymentStatus, UpdateStatusPayload } from './Device.types';
import { calculateConfigHash } from '../../utils/transformers/config-hash';

export class DeploymentService {
  /**
   * Initiate device config deployment to external API
   * Frontend calls this to deploy config to a device
   */
  async deployConfig(deviceId: string): Promise<DeploymentStatus> {
    try {
      const device = await Device.findById(deviceId);
      if (!device) throw new Error('Device not found');

      const config = await deviceService.getConfigByDeviceId(deviceId);

      // Initialize deployment record
      device.deployment = {
        status: 'pending',
        message: null,
      };

      // Call external API to send config to device
      try {
        await this.sendConfigToExternalAPI(config);

        // Update status to 'sent' after successful external API call
        device.deployment.status = 'sent';
        device.deployment.sentAt = new Date();
      } catch (apiError: any) {
        device.deployment.status = 'error';
        device.deployment.message = `Failed to send config: ${apiError.message}`;
        await device.save();
        throw apiError;
      }

      console.log('Deployment initiated for device:', device);
      await device.save();

      return {
        status: device.deployment.status,
        sentAt: device.deployment.sentAt,
      };
    } catch (error: any) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Fetch deployment status for a device (polled by frontend)
   */
  async getDeploymentStatus(deviceId: string): Promise<DeploymentStatus> {
    try {
      const device = await Device.findById(deviceId);
      if (!device) throw new Error('Device not found');

      if (!device.deployment) {
        return {
          status: 'pending',
        };
      }

      return {
        status: device.deployment.status,
        message: device.deployment.message || undefined,
        sentAt: device.deployment.sentAt || undefined,
        savedAt: device.deployment.savedAt || undefined,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch deployment status: ${error.message}`);
    }
  }

  /**
   * Update deployment status (called by device after processing config)
   * Device sends 'applied' when config was applied successfully, or 'error' if failed
   */
  async updateDeploymentStatus(
    deviceId: string,
    payload: UpdateStatusPayload,
  ): Promise<DeploymentStatus> {
    try {
      const device = await Device.findById(deviceId);
      if (!device) throw new Error('Device not found');

      if (!device.deployment) {
        throw new Error('No active deployment for this device');
      }

      // Update status
      device.deployment.status = payload.status;

      if (payload.status === 'applied') {
        device.deployment.savedAt = new Date();
        device.deployment.message = null;
      } else if (payload.status === 'error') {
        device.deployment.message = payload.message || 'Unknown error occurred';
      }

      await device.save();

      return {
        status: device.deployment.status,
        message: device.deployment.message || undefined,
        sentAt: device.deployment.sentAt || undefined,
        savedAt: device.deployment.savedAt || undefined,
      };
    } catch (error: any) {
      throw new Error(`Failed to update deployment status: ${error.message}`);
    }
  }

  /**
   * Internal: Send config to external API/device
   * Customize this based on your external API specifications
   */
  private async sendConfigToExternalAPI(config: any): Promise<void> {
    try {
      // TODO: Configure your external API endpoint
      const externalApiUrl =
        process.env.EXTERNAL_DEVICE_API_URL ||
        'https://mqtt-to-http-bridge-git-333639897356.europe-west1.run.app/c2d/commands/696bf997ecbc1c803c08fc2a';

      const response = await axios.post(
        externalApiUrl,
        {
          message: 'config',
          hash: calculateConfigHash(config),
          configId: config.configId,
          config,
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data || response.status !== 200) {
        throw new Error(`External API returned status ${response.status}`);
      }
    } catch (error: any) {
      throw new Error(`External API call failed: ${error.message}`);
    }
  }

  /**
   * Get deployment history for a device (optional - for audit trail)
   */
  // async getDeploymentHistory(deviceId: string) {
  //   try {
  //     const device = await Device.findById(deviceId).select('deployment updatedAt createdAt');
  //     if (!device) throw new Error('Device not found');

  //     return {
  //       deviceId,
  //       currentDeployment: device.deployment,
  //       lastUpdated: device.updatedAt,
  //     };
  //   } catch (error: any) {
  //     throw new Error(`Failed to fetch deployment history: ${error.message}`);
  //   }
  // }
}

export const deploymentService = new DeploymentService();
