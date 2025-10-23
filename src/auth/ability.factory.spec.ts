import { AbilityFactory } from './ability.factory';
import { PermissionsService } from 'src/roles/permissions.service';

describe('AbilityFactory', () => {
  let factory: AbilityFactory;

  const mockPermService: jest.Mocked<PermissionsService> = {
    getPermissionsForRole: jest.fn(),
  } as unknown as jest.Mocked<PermissionsService>;

  beforeEach(() => {
    factory = new AbilityFactory(mockPermService);
    jest.clearAllMocks();
  });

  it('should grant manage all when all:manage permission present', async () => {
    (mockPermService.getPermissionsForRole as jest.Mock).mockResolvedValue([
      { id: 1, name: 'all:manage' },
    ]);

    const ability = await factory.createForRole(1);
    expect(ability.can('manage', 'anything')).toBe(true);
  });

  it('should map resource:action permissions to abilities', async () => {
    (mockPermService.getPermissionsForRole as jest.Mock).mockResolvedValue([
      { id: 1, name: 'users:create' },
      { id: 2, name: 'apis:read' },
    ]);

    const ability = await factory.createForRole(2);
    expect(ability.can('create', 'users')).toBe(true);
    expect(ability.can('read', 'apis')).toBe(true);
    expect(ability.can('delete', 'users')).toBe(false);
  });
});
