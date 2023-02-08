import { ISettingsUser } from '@cased/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextDate,
  TextLink,
} from '@cased/ui';
import { useMemo } from 'react';

export interface TableUsersAndRolesProps {
  list: ISettingsUser[];
}

export function TableUsersAndRoles({ list }: TableUsersAndRolesProps) {
  const printUserAndRoles = useMemo(
    () =>
      list.map(({ id, name, role, created }) => (
        <TableRow noHeader key={id}>
          <TableCell>{name}</TableCell>
          <TableCell testId="table-users__role">{role}</TableCell>

          <TableCell>
            <TextDate date={created} />
          </TableCell>

          <TableCell>
            <TextLink to={`/settings/users?permissions=${id}`}>
              Change Permissions
            </TextLink>
          </TableCell>

          <TableCell>
            <TextLink to={`/settings/users/${id}`}>View Activities</TextLink>
          </TableCell>
        </TableRow>
      )),
    [list],
  );

  return (
    <Table>
      <TableHead hide>
        <TableRow>
          <TableHeadCell>User</TableHeadCell>
          <TableHeadCell>Role</TableHeadCell>
          <TableHeadCell>Date</TableHeadCell>
          <TableHeadCell />
          <TableHeadCell />
        </TableRow>
      </TableHead>

      <TableBody>{printUserAndRoles}</TableBody>
    </Table>
  );
}

export default TableUsersAndRoles;
