import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextLink,
} from '@cased/ui';
import { ISettingsGroup } from '@cased/data';

export interface TableGroupsProps {
  list: ISettingsGroup[];
}

export function TableGroups({ list }: TableGroupsProps) {
  const printGroups = useMemo(
    () =>
      list.map(({ id, name, users }) => (
        <TableRow noHeader key={id}>
          <TableCell>{name}</TableCell>
          <TableCell>{users} User(s)</TableCell>

          <TableCell>
            <TextLink to={`/settings/groups/${id}`}>View Users</TextLink>
          </TableCell>

          <TableCell>
            <TextLink to={`/settings/groups/activity/${id}`}>
              View Activities
            </TextLink>
          </TableCell>
        </TableRow>
      )),
    [list],
  );

  return (
    <Table>
      <TableHead hide>
        <TableRow>
          <TableHeadCell>Group</TableHeadCell>
          <TableHeadCell>User Count</TableHeadCell>
          <TableHeadCell />
          <TableHeadCell />
        </TableRow>
      </TableHead>

      <TableBody>{printGroups}</TableBody>
    </Table>
  );
}

export default TableGroups;
