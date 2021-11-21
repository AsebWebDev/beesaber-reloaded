import {
  MDBNavbar,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBSwitch,
} from 'mdb-react-ui-kit';
import React from 'react';

type Props = {
  activeitem: string;
  setIsPlayedByHive: (isOn: boolean) => void;
  toggleTab: (id: string) => void;
};
const ScoreNavbar = ({
  activeitem,
  setIsPlayedByHive,
  toggleTab,
}: Props): JSX.Element => {
  // eslint-disable-next-line no-console
  console.log('🚀 ~ file: ScoreNavbar.tsx ~ line 10 ~ activeitem', activeitem);

  return (
    <MDBNavbar className="nav-tabs mt-4 ml-2 mr-2">
      <MDBNavbarItem>
        <MDBNavbarLink
          to="#"
          active={activeitem === '1'}
          onClick={() => toggleTab('1')}
          role="tab"
        >
          Recent
        </MDBNavbarLink>
      </MDBNavbarItem>
      <MDBNavbarItem>
        <MDBNavbarLink
          to="#"
          active={activeitem === '2'}
          onClick={() => toggleTab('2')}
          role="tab"
        >
          Top
        </MDBNavbarLink>
      </MDBNavbarItem>
      <MDBNavbarItem>
        <MDBSwitch
          label="songs only shared by hive "
          onChange={(isOn: boolean) => setIsPlayedByHive(isOn)}
        />
      </MDBNavbarItem>
    </MDBNavbar>
  );
};

export default ScoreNavbar;
