package de.metas.notification;

import java.util.List;

import org.adempiere.util.Check;

import com.google.common.collect.ImmutableList;

import lombok.Builder;
import lombok.NonNull;
import lombok.Singular;
import lombok.Value;

/*
 * #%L
 * de.metas.adempiere.adempiere.base
 * %%
 * Copyright (C) 2018 metas GmbH
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 2 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public
 * License along with this program. If not, see
 * <http://www.gnu.org/licenses/gpl-2.0.html>.
 * #L%
 */

@Value
public class RoleNotificationsConfig
{
	private final int roleId;
	private List<UserNotificationsGroup> notificationGroups;

	@Builder
	public RoleNotificationsConfig(
			final int roleId,
			@NonNull @Singular final ImmutableList<UserNotificationsGroup> notificationGroups)
	{
		Check.assumeGreaterOrEqualToZero(roleId, "roleId");
		this.roleId = roleId;
		this.notificationGroups = notificationGroups;
	}
}
