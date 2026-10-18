import { Profile } from '../../../domain/models/models';

export interface CredentialSlip {
  profile: Profile;
  password: string;
}
