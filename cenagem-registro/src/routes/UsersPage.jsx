import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cenagemApi } from '@/lib/apiClient';
import HomeHeader from '@/modules/home/components/HomeHeader.jsx';
import Button from '@/modules/shared/ui/Button';
import Select from '@/modules/shared/ui/Select';
import TextInput from '@/modules/shared/ui/TextInput';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'INVITED', label: 'Invitado' },
];

const STATUS_LABEL = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  INVITED: 'Invitado',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  INVITED: 'bg-amber-100 text-amber-800 border-amber-200',
};

const EMPTY_FORM = {
  username: '',
  firstName: '',
  lastName: '',
  password: '',
  licenseNumber: '',
  roles: [],
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const describeError = (error, fallback) =>
  (error && error.message && typeof error.message === 'string'
    ? error.message
    : fallback);

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
};

function RoleCheckboxList({ availableRoles, selectedRoles, onToggle, disabled }) {
  if (!availableRoles.length) {
    return <p className="text-xs text-slate-500">No hay roles disponibles.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {availableRoles.map((role) => {
        const checked = selectedRoles.includes(role.name);
        return (
          <label
            key={role.id ?? role.name}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm transition ${
              checked
                ? 'border-slate-900 bg-slate-100'
                : 'border-slate-200 bg-white'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'}`}
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={checked}
              onChange={() => onToggle(role.name)}
              disabled={disabled}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">{role.name}</span>
              {role.description && (
                <span className="text-xs text-slate-500">{role.description}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default function UsersPage({ user, onBack, onLogout }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [selectedUserId, setSelectedUserId] = useState(null);
  const selectedUser = useMemo(
    () => users.find((candidate) => candidate.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editRoles, setEditRoles] = useState([]);
  const [statusSaving, setStatusSaving] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [rolesMessage, setRolesMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [rolesError, setRolesError] = useState('');

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewUsers = permissions.includes('USERS_VIEW');
  const canManageUsers = permissions.includes('USERS_MANAGE');

  const loadUsers = useCallback(async () => {
    if (!canViewUsers) {
      setUsers([]);
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        cenagemApi.listUsers(),
        cenagemApi.listRoles(),
      ]);
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      setRoles(Array.isArray(rolesResponse) ? rolesResponse : []);
    } catch (err) {
      setError(describeError(err, 'No se pudieron cargar los usuarios.'));
    } finally {
      setLoading(false);
    }
  }, [canViewUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedUser) {
      setEditStatus('ACTIVE');
      setEditRoles([]);
      return;
    }
    setEditStatus(selectedUser.status);
    setEditRoles(Array.isArray(selectedUser.roles) ? selectedUser.roles : []);
    setStatusMessage('');
    setRolesMessage('');
    setStatusError('');
    setRolesError('');
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUserId && !users.some((candidate) => candidate.id === selectedUserId)) {
      setSelectedUserId(null);
    }
  }, [users, selectedUserId]);

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleCreateRole = (roleName) => {
    setCreateForm((prev) => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists
          ? prev.roles.filter((role) => role !== roleName)
          : [...prev.roles, roleName],
      };
    });
  };

  const toggleEditRole = (roleName) => {
    setEditRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((role) => role !== roleName)
        : [...prev, roleName],
    );
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!canManageUsers) return;

    setCreateError('');
    setCreateSuccess('');

    const payload = {
      username: createForm.username.trim().toLowerCase(),
      password: createForm.password,
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
    };

    if (createForm.licenseNumber.trim()) {
      payload.licenseNumber = createForm.licenseNumber.trim();
    }
    if (createForm.roles.length > 0) {
      payload.roles = createForm.roles;
    }

    setCreatingUser(true);
    try {
      const created = await cenagemApi.createUser(payload);
      setUsers((prev) => [created, ...prev]);
      setCreateSuccess('Usuario creado correctamente.');
      setCreateForm(EMPTY_FORM);
      setSelectedUserId(created.id);
    } catch (err) {
      setCreateError(describeError(err, 'No se pudo crear el usuario.'));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser || !canManageUsers) return;
    setStatusError('');
    setStatusMessage('');
    setStatusSaving(true);
    try {
      const updated = await cenagemApi.updateUserStatus(selectedUser.id, editStatus);
      setUsers((prev) =>
        prev.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
      );
      setStatusMessage('Estado actualizado.');
    } catch (err) {
      setStatusError(describeError(err, 'No se pudo actualizar el estado.'));
    } finally {
      setStatusSaving(false);
    }
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser || !canManageUsers || editRoles.length === 0) return;
    setRolesError('');
    setRolesMessage('');
    setRolesSaving(true);
    try {
      const updated = await cenagemApi.updateUserRoles(selectedUser.id, editRoles);
      setUsers((prev) =>
        prev.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
      );
      setRolesMessage('Roles actualizados.');
    } catch (err) {
      setRolesError(describeError(err, 'No se pudieron actualizar los roles.'));
    } finally {
      setRolesSaving(false);
    }
  };

  if (!canViewUsers) {
    return (
      <div className="app-shell grid gap-4 p-6">
        <HomeHeader title="Administración de usuarios" user={user} onLogout={onLogout} />
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h2 className="text-lg font-semibold">No tenés acceso a esta sección</h2>
          <p className="mt-2 text-sm">
            Consultá con un administrador para solicitar permisos de <span className="font-medium">USERS_VIEW</span>.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium hover:bg-amber-100 transition"
            >
              Volver al inicio
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell grid gap-4 p-6">
      <HomeHeader title="Administración de usuarios" user={user} onLogout={onLogout} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          ← Volver
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={loadUsers}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          Actualizar listado
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Usuarios registrados</h2>
            <span className="text-xs text-slate-500">
              {users.length} usuario{users.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Cargando usuarios…
            </div>
          ) : error ? (
            <div className="py-6 text-sm text-rose-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Todavía no hay usuarios cargados.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Roles</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2">Último acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => {
                    const isSelected = item.id === selectedUserId;
                    return (
                      <tr
                        key={item.id}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                        }`}
                        onClick={() =>
                          setSelectedUserId((prev) => (prev === item.id ? null : item.id))
                        }
                      >
                        <td className="py-3 pr-3 align-top">
                          <div className="font-medium text-slate-900">
                            {item.displayName}
                          </div>
                          <div className="text-xs text-slate-500">{item.email}</div>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {item.roles.length ? (
                              item.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Sin roles</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE[item.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                          >
                            {STATUS_LABEL[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="py-3 align-top text-xs text-slate-500">
                          {formatDateTime(item.lastLoginAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {canManageUsers && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Crear usuario</h2>
            <p className="mt-1 text-xs text-slate-500">
              Configurá una cuenta nueva para el equipo.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={handleCreateSubmit}>
              <TextInput
                label="Usuario"
                type="text"
                value={createForm.username}
                onChange={(value) => handleCreateChange('username', value)}
                placeholder="usuario"
                autoComplete="username"
                required
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput
                  label="Nombre"
                  value={createForm.firstName}
                  onChange={(value) => handleCreateChange('firstName', value)}
                  autoComplete="given-name"
                  required
                />
                <TextInput
                  label="Apellido"
                  value={createForm.lastName}
                  onChange={(value) => handleCreateChange('lastName', value)}
                  autoComplete="family-name"
                  required
                />
              </div>
              <TextInput
                label="Contraseña temporal"
                type="password"
                value={createForm.password}
                onChange={(value) => handleCreateChange('password', value)}
                placeholder="Debe tener al menos 8 caracteres"
                autoComplete="new-password"
                required
              />
              <TextInput
                label="Matrícula (opcional)"
                value={createForm.licenseNumber}
                onChange={(value) => handleCreateChange('licenseNumber', value)}
                placeholder="MN-0000"
                autoComplete="off"
              />
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Roles</span>
                <RoleCheckboxList
                  availableRoles={roles}
                  selectedRoles={createForm.roles}
                  onToggle={toggleCreateRole}
                  disabled={!canManageUsers || !roles.length}
                />
              </div>
              {createError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {createSuccess}
                </div>
              )}
              <Button type="submit" disabled={creatingUser}>
                {creatingUser ? 'Creando…' : 'Crear usuario'}
              </Button>
            </form>
          </section>
        )}
      </div>

      {selectedUser && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedUser.displayName}
              </h2>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE[selectedUser.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                {STATUS_LABEL[selectedUser.status] ?? selectedUser.status}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                Último acceso: {formatDateTime(selectedUser.lastLoginAt)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Estado</h3>
              <Select
                label="Estado de la cuenta"
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value)}
                options={STATUS_OPTIONS}
                disabled={!canManageUsers}
              />
              {statusError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {statusError}
                </div>
              )}
              {statusMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {statusMessage}
                </div>
              )}
              <Button
                type="button"
                onClick={handleUpdateStatus}
                disabled={!canManageUsers || statusSaving}
              >
                {statusSaving ? 'Guardando…' : 'Actualizar estado'}
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Roles asignados</h3>
              <RoleCheckboxList
                availableRoles={roles}
                selectedRoles={editRoles}
                onToggle={toggleEditRole}
                disabled={!canManageUsers || !roles.length}
              />
              {!editRoles.length && (
                <p className="text-xs text-slate-500">
                  Seleccioná al menos un rol para guardar los cambios.
                </p>
              )}
              {rolesError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {rolesError}
                </div>
              )}
              {rolesMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {rolesMessage}
                </div>
              )}
              <Button
                type="button"
                onClick={handleUpdateRoles}
                disabled={!canManageUsers || rolesSaving || editRoles.length === 0}
              >
                {rolesSaving ? 'Guardando…' : 'Actualizar roles'}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
