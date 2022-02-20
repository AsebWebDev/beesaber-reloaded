import {
  MDBNavbar,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBSwitch,
} from 'mdb-react-ui-kit';
import styled from 'styled-components';

import tokens from '@/tokens';

import type { NavTabs } from '../ScoreBox';

const NavBar = styled(MDBNavbar)`
  background-color: ${tokens.color.page.bgColor.light};
  list-style: none;
  padding: 0 1rem;

  .nav-link {
    color: ${tokens.color.white.light};
  }

  .active {
    background-color: ${tokens.color.white.light};
    color: ${tokens.color.page.bgColor.main};
  }
`;

const NavigationItems = styled.div`
  display: flex;
`;

type Props = {
  activeitem: NavTabs;
  setIsPlayedByHive: (isOn: boolean) => void;
  toggleTab: (id: NavTabs) => void;
};

const ScoreNavbar = ({
  activeitem,
  setIsPlayedByHive,
  toggleTab,
}: Props): JSX.Element => (
  <NavBar>
    <NavigationItems>
      <MDBNavbarItem>
        <MDBNavbarLink
          to="#"
          active={activeitem === 'RECENT'}
          onClick={() => toggleTab('RECENT')}
          role="tab"
        >
          Recent
        </MDBNavbarLink>
      </MDBNavbarItem>
      <MDBNavbarItem>
        <MDBNavbarLink
          to="#"
          active={activeitem === 'TOP'}
          onClick={() => toggleTab('TOP')}
          role="tab"
        >
          Top
        </MDBNavbarLink>
      </MDBNavbarItem>
    </NavigationItems>
    <MDBNavbarItem>
      <MDBSwitch
        label="songs only shared by hive"
        onChange={(e: { target: { checked: boolean } }) =>
          setIsPlayedByHive(e.target.checked)
        }
      />
    </MDBNavbarItem>
  </NavBar>
);

export default ScoreNavbar;
