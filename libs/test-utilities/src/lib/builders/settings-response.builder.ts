import { ISettings } from '@cased/data';

export class SettingsReponseBuilder {
  private certificateAuthentication = false;
  private reasonRequired = false;
  private recordOutput = false;
  private githubRepos = 0;
  private ghAppUrl = '';

  build(): ISettings {
    return {
      certificateAuthentication: this.certificateAuthentication,
      certificateAuthority: false,
      ssh: {
        certificate: false,
        instructionText: '',
        organizationName: '',
        principalName: '',
        publicKey: '',
      },
      shell: {
        caEnabled: false,
        ghAppId: null,
        ghAppUrl: this.ghAppUrl,
        reasonRequired: this.reasonRequired,
        recordOutput: this.recordOutput,
      },
      githubRepos: this.githubRepos,
    };
  }

  withCa(value: boolean): SettingsReponseBuilder {
    this.certificateAuthentication = value;

    return this;
  }

  withReasonRequired(value: boolean): SettingsReponseBuilder {
    this.reasonRequired = value;

    return this;
  }

  withRecordOutput(value: boolean): SettingsReponseBuilder {
    this.recordOutput = value;

    return this;
  }

  withGithubRepos(value: number): SettingsReponseBuilder {
    this.githubRepos = value;

    return this;
  }

  withghAppUrl(value: string): SettingsReponseBuilder {
    this.ghAppUrl = value;

    return this;
  }
}
