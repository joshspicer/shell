import { ApprovalType, IApprovalProgram, IUserLabel } from '@cased/data';

export class ApprovalProgramBuilder {
  private _approvalType: ApprovalType = ApprovalType.anyone;
  private _restrictedUsers: IUserLabel[] = [];

  id = `1`;
  name = 'name';
  reasonRequired = false;
  blockNewSessions = false;
  approvalRequired = false;
  allowSelfApproval = false;
  customAutoApprovedCommands = '';
  sessionApprovalDuration = 0;
  sessionRequestTimeout = 0;

  build(): IApprovalProgram {
    return {
      id: this.id,
      name: this.name,
      reasonRequired: this.reasonRequired,
      blockNewSessions: this.blockNewSessions,
      approvalRequired: this.approvalRequired,
      approvalType: this._approvalType,
      allowSelfApproval: this.allowSelfApproval,
      customAutoApprovedCommands: this.customAutoApprovedCommands,
      sessionApprovalDuration: this.sessionApprovalDuration,
      sessionRequestTimeout: this.sessionRequestTimeout,
      restrictedUsers: this._restrictedUsers,
    };
  }

  withId(id: string): ApprovalProgramBuilder {
    this.id = id;
    return this;
  }

  withName(name: string): ApprovalProgramBuilder {
    this.name = name;
    return this;
  }

  withReasonRequired(reasonRequired: boolean): ApprovalProgramBuilder {
    this.reasonRequired = reasonRequired;
    return this;
  }

  withBlockNewSessions(blockNewSessions: boolean): ApprovalProgramBuilder {
    this.blockNewSessions = blockNewSessions;
    return this;
  }

  withApprovalRequired(approvalRequired: boolean): ApprovalProgramBuilder {
    this.approvalRequired = approvalRequired;
    return this;
  }

  withAllowSelfApproval(allowSelfApproval: boolean): ApprovalProgramBuilder {
    this.allowSelfApproval = allowSelfApproval;
    return this;
  }

  withCustomAutoApprovedCommands(
    customAutoApprovedCommands: string,
  ): ApprovalProgramBuilder {
    this.customAutoApprovedCommands = customAutoApprovedCommands;
    return this;
  }

  withSessionApprovalDuration(
    sessionApprovalDuration: number,
  ): ApprovalProgramBuilder {
    this.sessionApprovalDuration = sessionApprovalDuration;
    return this;
  }

  withSessionRequestTimeout(
    sessionRequestTimeout: number,
  ): ApprovalProgramBuilder {
    this.sessionRequestTimeout = sessionRequestTimeout;
    return this;
  }

  withApprovalType(type: ApprovalType) {
    this._approvalType = type;
    return this;
  }

  withRestrictedUsers(users: IUserLabel[]) {
    this._restrictedUsers = users;
    return this;
  }
}
